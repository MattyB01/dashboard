import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'hermes_session';
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Hash the password using scrypt for storage.
 * In production the stored hash comes from the DASHBOARD_PASSWORD env var.
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
 * Create a signed session token.
 */
function createSessionToken(): string {
  const payload = JSON.stringify({
    user: 'owner',
    ts: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const b64 = Buffer.from(payload).toString('base64');
  const sig = crypto.createHmac('sha256', COOKIE_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

/**
 * Verify a session token. Returns true if valid and not expired (7 day expiry).
 */
function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', COOKIE_SECRET).update(b64).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const age = Date.now() - payload.ts;
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  } catch {
    return false;
  }
}

/**
 * Get the stored password hash. In production this is the DASHBOARD_PASSWORD env var.
 */
function getStoredHash(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return null;
  // If it's already a hash (salt:hex format), use it directly
  if (pw.includes(':')) return pw;
  // Otherwise hash the plaintext password
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

/**
 * Set the session cookie after successful login.
 * Vercel edge/cookie constraints mean we need to keep payload small.
 */
export function createSessionCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const token = createSessionToken();
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
  };
}

/**
 * Check if the current request has a valid session.
 * Used by middleware.
 */
export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
