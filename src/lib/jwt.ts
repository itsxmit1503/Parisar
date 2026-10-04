import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'parisar-dhsgsu-sagar-jwt-signing-secret-key-2026-v3';
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || `${JWT_SECRET}-qr-hmac`;

export interface JWTPayload {
  sub: string;
  email: string;
  rollNumber?: string;
  role: UserRole;
  organizerStatus?: User['organizerStatus'];
  iat?: number;
  exp?: number;
}

/**
 * Signs an authenticated JWT token for a PARISAR user.
 */
export function signJWT(user: User, expiresIn: string = '7d'): string {
  const payload: JWTPayload = {
    sub: user._id,
    email: user.email,
    rollNumber: user.rollNumber,
    role: user.role,
    organizerStatus: user.organizerStatus,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Verifies a signed JWT token and returns the decoded payload or null.
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extracts a Bearer token from an Authorization header or cookie.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim() || null;
}

/**
 * Generates a cryptographically signed, non-predictable QR Pass Token for an event registration.
 * Format: PARISAR-QR.<eventId>.<userId>.<nonce>.<hmacSignature>
 */
export function generateSignedQrToken(eventId: string, userId: string, rollNumber?: string): string {
  const nonce = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  const rawPayload = `${eventId}:${userId}:${rollNumber || 'STU'}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', QR_HMAC_SECRET)
    .update(rawPayload)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
  return `DHSGSU-QR-${nonce}-${signature}`;
}

/**
 * Sanitizes a user object before sending to client (strips passwordHash).
 */
export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
