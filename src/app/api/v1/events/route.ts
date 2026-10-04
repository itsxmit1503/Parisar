import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
} from '../../../../lib/serverStore';
import {
  ok,
  err,
  CORS_HEADERS,
  requireAuth,
  requireOrganizer,
  findVenueConflicts,
} from '../../../../lib/apiMiddleware';
import { CampusEvent, EventStatus } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/events
 * Returns events filtered by role or query parameters.
 * Public/Students only see PUBLISHED, APPROVED, ONGOING, COMPLETED unless includeAll=1 for organizers/admins.
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');
  const organizerId = searchParams.get('organizerId');
  const includeAll = searchParams.get('includeAll') === 'true';

  let list = [...db.events];

  if (organizerId) {
    list = list.filter(e => e.organizerId === organizerId);
  } else if (!includeAll) {
    const auth = requireAuth(req);
    const role = auth.authenticated ? auth.user.role : 'student';
    if (role === 'student') {
      list = list.filter(e =>
        ['PUBLISHED', 'APPROVED', 'ONGOING', 'COMPLETED'].includes(e.status)
      );
    }
  }

  if (statusFilter) {
    list = list.filter(e => e.status === statusFilter);
  }

  return ok({ events: list, total: list.length });
}

/**
 * POST /api/v1/events
 * Create a new campus event (requires verified organizer or admin).
 * Enforces server-side venue conflict detection and lifecycle rules.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireOrganizer(req);
    if (!auth.authorized) return auth.response;

    const db = await loadSharedDbAsync();
    const creator = db.users.find(u => u._id === auth.user.sub);
    if (auth.user.role === 'organizer' && creator?.organizerStatus !== 'VERIFIED') {
      return err(
        'ORGANIZER_NOT_VERIFIED',
        'Only verified organizers approved by University Administration can create events.',
        403
      );
    }

    const body = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const venueId = (body.venueId || '').trim();
    const startTime = body.startTime;
    const endTime = body.endTime;
    const capacity = Number(body.capacity) || 100;
    const asDraft = Boolean(body.asDraft);

    if (!title || !description || !venueId || !startTime || !endTime) {
      return err(
        'VALIDATION_ERROR',
        'Title, description, venue, start time, and end time are required.',
        400
      );
    }

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      return err('INVALID_SCHEDULE', 'Event end time must be after start time.', 400);
    }

    // Server-side Venue Conflict Detection
    if (!asDraft && body.eventMode !== 'ONLINE') {
      const conflicts = findVenueConflicts(db.events, venueId, startTime, endTime);
      if (conflicts.length > 0) {
        return err(
          'VENUE_CONFLICT',
          `Venue schedule conflict with "${conflicts[0].title}" (${new Date(
            conflicts[0].startTime
          ).toLocaleString()}).`,
          409
        );
      }
    }

    const nowIso = new Date().toISOString();
    const venueObj = db.venues.find(v => v.id === venueId);
    const status: EventStatus = asDraft ? 'DRAFT' : 'PENDING_REVIEW';

    const newEvent: CampusEvent = {
      _id: body._id || `evt-${Date.now()}`,
      title,
      description,
      category: body.category || 'Seminar',
      eventMode: body.eventMode || 'OFFLINE',
      organizerId: creator?._id || auth.user.sub,
      organizerName: creator?.name || body.organizerName || 'DHSGSU Organizer',
      organizerEmail: creator?.email || auth.user.email,
      venue: venueObj?.name || body.venue || 'DHSGSU Campus Venue',
      venueId,
      startTime,
      endTime,
      capacity,
      registrationCount: 0,
      registrationDeadline: body.registrationDeadline || startTime,
      tags: Array.isArray(body.tags) ? body.tags : ['DHSGSU'],
      coverImage:
        body.coverImage ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      status,
      eligibility: body.eligibility || 'Open to all DHSGSU students',
      specialInstructions: body.specialInstructions || '',
      departmentScope: body.departmentScope || creator?.department || 'Open to all DHSGSU',
      certificateRequired: body.certificateRequired !== false,
      minParticipationPercent: Number(body.minParticipationPercent) || 80,
      attendanceSessionStatus: 'NOT_STARTED',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.events.unshift(newEvent);

    recordAuditLog({
      actor: auth.user.sub,
      actorName: creator?.name,
      role: auth.user.role,
      action: asDraft ? 'EVENT_CREATED' : 'EVENT_SUBMITTED',
      entity: 'CampusEvent',
      entityId: newEvent._id,
      metadata: { title: newEvent.title, status: newEvent.status, venue: newEvent.venue },
    });

    await persistSharedDb();
    return ok({ event: newEvent }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to create event', 500);
  }
}

/**
 * PATCH /api/v1/events
 * Update an event (Organizer updates own event or submits draft; Admin moderates status).
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = requireOrganizer(req);
    if (!auth.authorized) return auth.response;

    const db = await loadSharedDbAsync();
    const body = await req.json();
    const eventId = body.eventId || body._id;
    const existingIdx = db.events.findIndex(e => e._id === eventId);

    if (existingIdx === -1) {
      return err('EVENT_NOT_FOUND', 'Event not found.', 404);
    }

    const target = db.events[existingIdx];
    if (auth.user.role !== 'admin' && target.organizerId !== auth.user.sub) {
      return err('FORBIDDEN_OWNERSHIP', 'You can only modify events created by your account.', 403);
    }

    // Prevent organizer from bypassing moderation to directly set PUBLISHED/APPROVED
    if (
      auth.user.role !== 'admin' &&
      (body.status === 'PUBLISHED' || body.status === 'APPROVED') &&
      target.status !== 'PUBLISHED' &&
      target.status !== 'APPROVED'
    ) {
      return err(
        'MODERATION_REQUIRED',
        'Events require University Administrator approval before publishing.',
        403
      );
    }

    const nowIso = new Date().toISOString();
    const updatedEvent: CampusEvent = {
      ...target,
      ...body,
      _id: target._id,
      organizerId: target.organizerId,
      updatedAt: nowIso,
    };

    db.events[existingIdx] = updatedEvent;

    if (body.status && body.status !== target.status) {
      const actionMap: Record<string, 'EVENT_APPROVED' | 'EVENT_REJECTED' | 'EVENT_CANCELLED' | 'EVENT_SUBMITTED'> = {
        PUBLISHED: 'EVENT_APPROVED',
        APPROVED: 'EVENT_APPROVED',
        REJECTED: 'EVENT_REJECTED',
        CANCELLED: 'EVENT_CANCELLED',
        PENDING_REVIEW: 'EVENT_SUBMITTED',
      };
      const mappedAction = actionMap[body.status];
      if (mappedAction) {
        recordAuditLog({
          actor: auth.user.sub,
          role: auth.user.role,
          action: mappedAction,
          entity: 'CampusEvent',
          entityId: target._id,
          metadata: { title: target.title, newStatus: body.status, reason: body.rejectionReason },
        });
      }
    }

    await persistSharedDb();
    return ok({ event: updatedEvent });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to update event', 500);
  }
}
