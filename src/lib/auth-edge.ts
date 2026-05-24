/**
 * Edge-compatible auth utilities (no Node.js crypto dependency).
 * Used by middleware.ts which runs in Edge Runtime.
 */
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'hermes_session';

function getSecretKey(): string {
  return process.env.COOKIE_SECRET || '';
}

/**
 * Verify a signed session token using Web Crypto API (edge-compatible).
 */
async function verifySessionToken(token: string): Promise<boolean> {
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

  try {
    const payloadStr = atob(b64);
    const payload = JSON.parse(payloadStr);
    const age = Date.now() - payload.ts;
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  } catch {
    return false;
  }
}

/**
 * Check if the current request has a valid session.
 */
export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
