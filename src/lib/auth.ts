/**
 * Server-only auth utilities using Node.js crypto.
 * NOT imported by middleware (Edge Runtime incompatible).
 */
import crypto from 'crypto';

const SESSION_COOKIE = 'hermes_session';

/**
 * Hash the password using scrypt for storage.
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return salt + ':' + derivedKey.toString('hex');
}

/**
 * Verify a password against a stored hash (salt:derivedKey hex).
 */
function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return key === derivedKey.toString('hex');
}

/**
 * Get the stored password hash from env var.
 */
function getStoredHash(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return null;
  if (pw.includes(':')) return pw;
  return hashPassword(pw);
}

/**
 * Check if a password is correct.
 */
export function checkPassword(password: string): boolean {
  const stored = getStoredHash();
  if (!stored) return false;
  return verifyPassword(password, stored);
}

function getSecretKey(): string {
  return process.env.COOKIE_SECRET || '';
}

/**
 * Create a signed session token and cookie.
 * Uses crypto.getRandomValues (available in Node and modern runtimes).
 */
export async function createSessionCookie(): Promise<{ name: string; value: string; options: Record<string, unknown> }> {
  const secret = getSecretKey();
  const ts = Date.now();
  const nonceBytes = new Uint8Array(8);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const payload = JSON.stringify({ user: 'owner', ts, nonce });
  const b64 = Buffer.from(payload).toString('base64');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(b64));
  const sig = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

  const token = `${b64}.${sig}`;

  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    },
  };
}
