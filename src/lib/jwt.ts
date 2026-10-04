import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole, AdminLevel, AdminPermission, AdminAccountStatus } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'parisar-dhsgsu-sagar-jwt-signing-secret-key-2026-v3';
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || `${JWT_SECRET}-qr-hmac`;

export interface JWTPayload {
  sub: string;
  email: string;
  rollNumber?: string;
  adminId?: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  permissions?: AdminPermission[];
  status?: AdminAccountStatus;
  organizerStatus?: User['organizerStatus'];
  iat?: number;
  exp?: number;
}

/**
 * Signs an authenticated JWT token for a PARISAR user or administrator.
 */
export function signJWT(user: User, expiresIn: string = '24h'): string {
  const payload: JWTPayload = {
    sub: user._id,
    email: user.email,
    rollNumber: user.rollNumber,
    adminId: user.adminId,
    role: user.role,
    adminLevel: user.adminLevel,
    permissions: user.permissions,
    status: user.status || 'ACTIVE',
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
 * Extracts a Bearer token from an Authorization header or cookie value.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim() || null;
}

/**
 * Hashes a one-time invitation or password-reset token with SHA-256 so raw tokens are never stored.
 */
export function hashSecretToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Generates a cryptographically random one-time invitation or reset token.
 */
export function generateSecureRandomToken(bytes: number = 24): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generates a cryptographically signed registration reference code.
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
  return `DHSGSU-REG-${nonce}-${signature}`;
}

/**
 * Generates a short-lived (~60s), event-specific, student-specific, one-time-use
 * temporary QR attendance token for physical/offline events.
 * Does NOT embed raw sensitive student PII in the token string.
 */
export function generateTemporaryAttendanceTokenString(
  eventId: string,
  studentId: string,
  registrationId: string,
  expiresAtIso: string
): string {
  const nonce = crypto.randomBytes(12).toString('hex').toUpperCase();
  const rawPayload = `TEMP_QR:${eventId}:${studentId}:${registrationId}:${expiresAtIso}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', QR_HMAC_SECRET)
    .update(rawPayload)
    .digest('hex')
    .slice(0, 20)
    .toUpperCase();
  return `PARISAR-ATT-${nonce}-${signature}`;
}

/**
 * Sanitizes a user or administrator object before sending to client.
 * Strips passwordHash, invitationTokenHash, resetTokenHash, and any internal secrets.
 */
export function sanitizeUser(
  user: User
): Omit<User, 'passwordHash' | 'invitationTokenHash' | 'resetTokenHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, invitationTokenHash, resetTokenHash, ...safeUser } = user;
  return safeUser;
}
