import crypto from 'crypto';

const SESSION_COOKIE = 'hermes_session';

/**
 * Hash the password using scrypt for storage.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return salt + ':' + derivedKey.toString('hex');
}

/**
 * Verify a password against a stored hash (salt:derivedKey hex).
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return key === derivedKey.toString('hex');
}

/**
 * Get the stored password hash. In production this is the DASHBOARD_PASSWORD env var.
 */
function getStoredHash(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return null;
  if (pw.includes(':')) return pw;
  return hashPassword(pw);
}

/**
 * Check if a password is correct (compared to DASHBOARD_PASSWORD env var).
 */
export function checkPassword(password: string): boolean {
  const stored = getStoredHash();
  if (!stored) return false;
  return verifyPassword(password, stored);
}

// Edge-compatible helpers using Web Crypto API for session tokens

const SESSION_COOKIE_NAME = 'hermes_session';

function getSecretKey(): string {
  return process.env.COOKIE_SECRET || '';
}

/**
 * Create a signed session token using Web Crypto API (edge-compatible).
 */
export async function createSessionToken(): Promise<string> {
  const secret = getSecretKey();
  const ts = Date.now();
  const nonceBytes = new Uint8Array(8);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const payload = JSON.stringify({ user: 'owner', ts, nonce });
  const b64 = typeof Buffer !== 'undefined'
    ? Buffer.from(payload).toString('base64')
    : btoa(payload);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(b64));
  const sig = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${b64}.${sig}`;
}

/**
 * Verify a signed session token using Web Crypto API (edge-compatible).
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = getSecretKey();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify']
  );

  const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(b64));
  if (!valid) return false;

  // Decode payload and check expiry
  try {
    const payloadStr = typeof Buffer !== 'undefined'
      ? Buffer.from(b64, 'base64').toString('utf8')
      : atob(b64);
    const payload = JSON.parse(payloadStr);
    const age = Date.now() - payload.ts;
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  } catch {
    return false;
  }
}

/**
 * Set the session cookie after successful login.
 */
export async function createSessionCookie(): Promise<{ name: string; value: string; options: Record<string, unknown> }> {
  const token = await createSessionToken();
  return {
    name: SESSION_COOKIE_NAME,
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

/**
 * Check if the current request has a valid session.
 * Used by middleware — uses Web Crypto, works in Edge Runtime.
 */
export async function hasValidSession(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
