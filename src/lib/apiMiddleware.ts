import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractBearerToken, JWTPayload } from './jwt';
import { getSharedDb } from './serverStore';
import { UserRole, AdminPermission, CampusEvent, ALL_ADMIN_PERMISSIONS } from '../types';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function ok<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status, headers: CORS_HEADERS }
  );
}

export function err(code: string, message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code, message },
    },
    { status, headers: CORS_HEADERS }
  );
}

/**
 * Extracts and verifies the JWT token from Authorization header or HttpOnly cookie,
 * AND cross-checks the authoritative server database for live role, status, and permissions.
 * Never trusts client-submitted role/adminLevel/permissions.
 */
export function requireAuth(
  req: NextRequest
): { authenticated: true; user: JWTPayload } | { authenticated: false; response: NextResponse } {
  const authHeader =
    req.headers.get('authorization') ||
    req.cookies.get('parisar_token')?.value ||
    req.cookies.get('parisar_admin_session')?.value ||
    null;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      authenticated: false,
      response: err('UNAUTHORIZED', 'Authentication token is required.', 401),
    };
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    return {
      authenticated: false,
      response: err('INVALID_TOKEN', 'Session expired or invalid authentication token.', 401),
    };
  }

  // Always check authoritative server database for account status & live role
  const db = getSharedDb();
  const dbUser = db.users.find(u => u._id === decoded.sub || u.email.toLowerCase() === decoded.email.toLowerCase());
  if (!dbUser) {
    return {
      authenticated: false,
      response: err('ACCOUNT_NOT_FOUND', 'Authenticated account no longer exists.', 401),
    };
  }

  if (dbUser.status === 'SUSPENDED') {
    return {
      authenticated: false,
      response: err('ACCOUNT_SUSPENDED', 'Your administrator account has been suspended.', 403),
    };
  }

  if (dbUser.status === 'REVOKED') {
    return {
      authenticated: false,
      response: err('ACCOUNT_REVOKED', 'Your account access has been revoked.', 403),
    };
  }

  const authoritativeUser: JWTPayload = {
    ...decoded,
    sub: dbUser._id,
    email: dbUser.email,
    rollNumber: dbUser.rollNumber,
    adminId: dbUser.adminId,
    role: dbUser.role,
    adminLevel: dbUser.adminLevel,
    permissions:
      dbUser.adminLevel === 'SUPER_ADMIN'
        ? [...ALL_ADMIN_PERMISSIONS]
        : dbUser.permissions || [],
    status: dbUser.status || 'ACTIVE',
    organizerStatus: dbUser.organizerStatus,
  };

  return { authenticated: true, user: authoritativeUser };
}

/**
 * Verifies authentication AND checks that the user's server-verified role is in allowedRoles.
 */
export function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): { authorized: true; user: JWTPayload } | { authorized: false; response: NextResponse } {
  const authResult = requireAuth(req);
  if (!authResult.authenticated) {
    return { authorized: false, response: authResult.response };
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      authorized: false,
      response: err(
        'FORBIDDEN_ROLE',
        'You do not have permission to perform this action.',
        403
      ),
    };
  }

  return { authorized: true, user: authResult.user };
}

/**
 * Verifies the user is an active University Administrator and optionally enforces a granular AdminPermission.
 * SUPER_ADMIN automatically has all permissions.
 */
export function requireAdmin(
  req: NextRequest,
  requiredPermission?: AdminPermission
): { authorized: true; user: JWTPayload } | { authorized: false; response: NextResponse } {
  const roleCheck = requireRole(req, ['admin']);
  if (!roleCheck.authorized) return roleCheck;

  const { user } = roleCheck;
  if (user.status && user.status !== 'ACTIVE') {
    return {
      authorized: false,
      response: err('ADMIN_NOT_ACTIVE', `Your administrator account is ${user.status.toLowerCase()}.`, 403),
    };
  }

  if (requiredPermission && user.adminLevel !== 'SUPER_ADMIN') {
    const perms = user.permissions || [];
    if (!perms.includes(requiredPermission)) {
      return {
        authorized: false,
        response: err(
          'INSUFFICIENT_ADMIN_PERMISSION',
          `You do not have permission (${requiredPermission}) to perform this action.`,
          403
        ),
      };
    }
  }

  return { authorized: true, user };
}

/**
 * Enforces that the caller is an active SUPER_ADMIN (or holds MANAGE_ADMINS where appropriate).
 */
export function requireSuperAdmin(
  req: NextRequest
): { authorized: true; user: JWTPayload } | { authorized: false; response: NextResponse } {
  const adminCheck = requireAdmin(req, 'MANAGE_ADMINS');
  if (!adminCheck.authorized) return adminCheck;

  if (adminCheck.user.adminLevel !== 'SUPER_ADMIN') {
    return {
      authorized: false,
      response: err(
        'SUPER_ADMIN_REQUIRED',
        'Only an active University Super Administrator can perform this operation.',
        403
      ),
    };
  }

  return adminCheck;
}

export function requireOrganizer(req: NextRequest) {
  return requireRole(req, ['organizer', 'admin']);
}

export function requireStudent(req: NextRequest) {
  return requireRole(req, ['student', 'organizer', 'admin']);
}

/**
 * Checks whether a user object has a specific AdminPermission.
 */
export function hasAdminPermission(
  user: { role?: UserRole; adminLevel?: string; permissions?: AdminPermission[] } | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user || user.role !== 'admin') return false;
  if (user.adminLevel === 'SUPER_ADMIN') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

/**
 * Server-side venue conflict detection rule:
 * existingStart < newEnd AND newStart < existingEnd for the same venueId
 */
export function findVenueConflicts(
  events: CampusEvent[],
  venueId: string,
  startTime: string,
  endTime: string,
  excludeEventId?: string
): CampusEvent[] {
  if (!venueId || venueId === 'online') return [];
  const newStart = new Date(startTime).getTime();
  const newEnd = new Date(endTime).getTime();
  if (isNaN(newStart) || isNaN(newEnd)) return [];

  return events.filter(ev => {
    if (excludeEventId && ev._id === excludeEventId) return false;
    if (ev.venueId !== venueId) return false;
    if (ev.status === 'REJECTED' || ev.status === 'CANCELLED' || ev.status === 'DRAFT') return false;

    const existingStart = new Date(ev.startTime).getTime();
    const existingEnd = new Date(ev.endTime).getTime();
    return existingStart < newEnd && newStart < existingEnd;
  });
}
