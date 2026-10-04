import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  generateSignedQrToken,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth } from '../../../../lib/apiMiddleware';
import { Registration, CampusNotification } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/registrations
 * Returns registrations (filtered by eventId or userId).
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  const userId = searchParams.get('userId');

  let list = [...db.registrations];
  if (eventId) list = list.filter(r => r.eventId === eventId);
  if (userId) list = list.filter(r => r.userId === userId);

  return ok({ registrations: list, total: list.length });
}

/**
 * POST /api/v1/registrations
 * Server-side registration with capacity, deadline, duplicate prevention, and HMAC-signed QR token.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();

    const eventId = (body.eventId || '').trim();
    const userId = auth.authenticated ? auth.user.sub : (body.userId || '').trim();

    if (!eventId || !userId) {
      return err('VALIDATION_ERROR', 'Event ID and User ID are required.', 400);
    }

    const event = db.events.find(e => e._id === eventId);
    if (!event) {
      return err('EVENT_NOT_FOUND', 'The selected campus event does not exist.', 404);
    }

    if (event.status !== 'PUBLISHED' && event.status !== 'APPROVED' && event.status !== 'ONGOING') {
      return err(
        'EVENT_NOT_OPEN',
        `Registrations are not open for this event (status: ${event.status}).`,
        400
      );
    }

    // 1. Check Registration Deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return err('DEADLINE_PASSED', 'The registration deadline for this event has passed.', 400);
    }

    // 2. Check Duplicate Registration
    const existingReg = db.registrations.find(
      r => r.eventId === eventId && r.userId === userId && r.status === 'CONFIRMED'
    );
    if (existingReg) {
      return err('DUPLICATE_REGISTRATION', 'You are already registered for this event.', 409);
    }

    // 3. Check Event Capacity
    const confirmedCount = db.registrations.filter(
      r => r.eventId === eventId && r.status === 'CONFIRMED'
    ).length;
    if (confirmedCount >= event.capacity) {
      return err('EVENT_CAPACITY_FULL', 'Registration capacity has been reached.', 409);
    }

    const user = db.users.find(u => u._id === userId);
    const nowIso = new Date().toISOString();

    // Generate cryptographically signed, non-predictable QR token
    const qrToken = generateSignedQrToken(eventId, userId, user?.rollNumber);

    const newReg: Registration = {
      _id: body._id || `reg-${Date.now()}`,
      eventId,
      userId,
      userName: user?.name || body.userName || 'DHSGSU Student',
      userRollNumber: user?.rollNumber || body.userRollNumber || 'DHSGSU-ID',
      userDepartment: user?.department || body.userDepartment || 'DHSGSU',
      userEmail: user?.email || body.userEmail || '',
      status: 'CONFIRMED',
      registeredAt: nowIso,
      qrToken,
      checkedInAt: null,
    };

    db.registrations.unshift(newReg);
    event.registrationCount = confirmedCount + 1;
    event.updatedAt = nowIso;

    const notif: CampusNotification = {
      _id: `notif-${Date.now()}`,
      userId,
      eventId,
      type: 'REGISTRATION_CONFIRMED',
      title: `Registration Confirmed: ${event.title}`,
      message: `Your digital pass (${qrToken}) for "${event.title}" at ${event.venue} is ready.`,
      read: false,
      createdAt: nowIso,
    };
    db.notifications.unshift(notif);

    recordAuditLog({
      actor: userId,
      actorName: newReg.userName,
      role: user?.role || 'student',
      action: 'REGISTRATION_CREATED',
      entity: 'Registration',
      entityId: newReg._id,
      metadata: { eventId, eventTitle: event.title, qrToken },
    });

    await persistSharedDb();
    return ok({ registration: newReg, event }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Registration failed', 500);
  }
}

/**
 * DELETE /api/v1/registrations
 * Cancel a student's registration.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get('id') || searchParams.get('registrationId');

    if (!registrationId) {
      return err('VALIDATION_ERROR', 'Registration ID is required.', 400);
    }

    const regIdx = db.registrations.findIndex(r => r._id === registrationId);
    if (regIdx === -1) {
      return err('NOT_FOUND', 'Registration record not found.', 404);
    }

    const reg = db.registrations[regIdx];
    if (
      auth.authenticated &&
      auth.user.role === 'student' &&
      reg.userId !== auth.user.sub
    ) {
      return err('FORBIDDEN', 'You cannot cancel another student’s registration.', 403);
    }

    if (reg.checkedInAt) {
      return err(
        'ALREADY_CHECKED_IN',
        'Cannot cancel registration after attendance has been recorded.',
        400
      );
    }

    reg.status = 'CANCELLED';
    const event = db.events.find(e => e._id === reg.eventId);
    if (event && event.registrationCount > 0) {
      event.registrationCount -= 1;
    }

    recordAuditLog({
      actor: reg.userId,
      actorName: reg.userName,
      role: 'student',
      action: 'REGISTRATION_CANCELLED',
      entity: 'Registration',
      entityId: reg._id,
      metadata: { eventId: reg.eventId },
    });

    await persistSharedDb();
    return ok({ cancelled: true, registrationId });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Cancellation failed', 500);
  }
}
