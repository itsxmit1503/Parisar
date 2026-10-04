import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractBearerToken, JWTPayload } from './jwt';
import { UserRole, CampusEvent } from '../types';

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
 * Extracts and verifies the JWT token from Authorization header or cookie.
 * Returns { user: JWTPayload } or a NextResponse 401 error.
 */
export function requireAuth(
  req: NextRequest
): { authenticated: true; user: JWTPayload } | { authenticated: false; response: NextResponse } {
  const authHeader = req.headers.get('authorization') || req.cookies.get('parisar_token')?.value || null;
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

  return { authenticated: true, user: decoded };
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
        `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        403
      ),
    };
  }

  return { authorized: true, user: authResult.user };
}

export function requireAdmin(req: NextRequest) {
  return requireRole(req, ['admin']);
}

export function requireOrganizer(req: NextRequest) {
  return requireRole(req, ['organizer', 'admin']);
}

export function requireStudent(req: NextRequest) {
  return requireRole(req, ['student', 'organizer', 'admin']);
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
