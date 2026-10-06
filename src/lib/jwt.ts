import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'civicfix-security-ops-token-secret-key-2026';

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export interface JwtPayload {
  uid: string;
  email: string;
  name?: string;
  role: 'admin' | 'worker' | 'supervisor' | 'citizen';
  anonymousPublicId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Sign a HS256 JWT token valid for 7 days by default
 */
export function signJwt(payload: JwtPayload, expiresInSeconds: number = 7 * 24 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(message)
    .digest();
  const signatureB64 = base64UrlEncode(signature);

  return `${message}.${signatureB64}`;
}

/**
 * Verify a HS256 JWT token and return its payload if valid and not expired
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(message)
      .digest();
    const expectedSigB64 = base64UrlEncode(expectedSig);

    if (expectedSigB64 !== signatureB64) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Hash a password using PBKDF2 with SHA-512 and a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHash] = parts;
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === expectedHash;
}
