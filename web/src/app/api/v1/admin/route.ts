import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  sanitizeUser,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAdmin } from '../../../../lib/apiMiddleware';
import { EventStatus } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/admin
 * Returns University Administrator executive metrics, pending organizer requests, and event moderation queue.
 */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  const db = await loadSharedDbAsync();
  const metrics = {
    totalStudents: db.users.filter(u => u.role === 'student').length,
    verifiedOrganizers: db.users.filter(
      u => u.role === 'organizer' && u.organizerStatus === 'VERIFIED'
    ).length,
    pendingOrganizerRequests: db.organizerRequests.filter(r => r.status === 'PENDING').length,
    pendingEvents: db.events.filter(e => e.status === 'PENDING_REVIEW').length,
    publishedEvents: db.events.filter(
      e => e.status === 'PUBLISHED' || e.status === 'APPROVED' || e.status === 'ONGOING'
    ).length,
    completedEvents: db.events.filter(e => e.status === 'COMPLETED').length,
    totalRegistrations: db.registrations.filter(r => r.status === 'CONFIRMED').length,
    totalAttendance: db.attendance.length,
    totalCertificates: db.certificates.length,
    totalVenues: db.venues.length,
  };

  return ok({
    metrics,
    organizerRequests: db.organizerRequests,
    events: db.events,
    users: db.users.map(sanitizeUser),
    auditLogs: db.auditLogs.slice(0, 100),
  });
}

/**
 * POST /api/v1/admin
 * Admin actions: 'moderate-event', 'review-organizer', 'update-role'
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const action = body.action;

    if (action === 'moderate-event') {
      const eventId = body.eventId;
      const newStatus: EventStatus = body.status || body.newStatus;
      const rejectionReason = body.rejectionReason;

      const evIdx = db.events.findIndex(e => e._id === eventId);
      if (evIdx === -1) {
        return err('EVENT_NOT_FOUND', 'Event not found.', 404);
      }

      const nowIso = new Date().toISOString();
      db.events[evIdx] = {
        ...db.events[evIdx],
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined,
        updatedAt: nowIso,
      };

      recordAuditLog({
        actor: auth.authorized ? auth.user.sub : 'admin-1',
        role: 'admin',
        action:
          newStatus === 'REJECTED'
            ? 'EVENT_REJECTED'
            : newStatus === 'CANCELLED'
            ? 'EVENT_CANCELLED'
            : 'EVENT_APPROVED',
        entity: 'CampusEvent',
        entityId: eventId,
        metadata: { title: db.events[evIdx].title, newStatus, rejectionReason },
      });

      await persistSharedDb();
      return ok({ event: db.events[evIdx] });
    }

    return err('UNKNOWN_ADMIN_ACTION', 'Unsupported administrative action.', 400);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Admin operation failed', 500);
  }
}
