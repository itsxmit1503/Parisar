import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireOrganizer } from '../../../../lib/apiMiddleware';
import { Certificate, CampusNotification } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/certificates
 * Supports lookup by verificationCode, userId, or eventId.
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || searchParams.get('verificationCode');
  const userId = searchParams.get('userId');
  const eventId = searchParams.get('eventId');

  if (code) {
    const cleanCode = code.trim().toUpperCase();
    const cert = db.certificates.find(
      c => c.verificationCode.toUpperCase() === cleanCode || c._id.toUpperCase() === cleanCode
    );
    if (!cert) {
      return err('CERTIFICATE_NOT_FOUND', `No authentic DHSGSU certificate matches "${cleanCode}".`, 404);
    }
    const event = db.events.find(e => e._id === cert.eventId);
    return ok({ verified: true, certificate: cert, event });
  }

  let list = [...db.certificates];
  if (userId) list = list.filter(c => c.userId === userId);
  if (eventId) list = list.filter(c => c.eventId === eventId);

  return ok({ certificates: list, total: list.length });
}

/**
 * POST /api/v1/certificates
 * Server-side certificate issuance for eligible attendees (participationPercent >= minParticipationPercent).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireOrganizer(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const eventId = (body.eventId || '').trim();

    const event = db.events.find(e => e._id === eventId);
    if (!event) {
      return err('EVENT_NOT_FOUND', 'Event not found.', 404);
    }

    const minPct = event.minParticipationPercent ?? 80;
    const eventAttendees = db.attendance.filter(a => a.eventId === eventId);

    const eligibleAttendees = eventAttendees.filter(att => {
      const pct = att.participationPercent ?? 100;
      const alreadyIssued = db.certificates.some(
        c => c.eventId === eventId && c.userId === att.userId
      );
      return pct >= minPct && !alreadyIssued;
    });

    if (eligibleAttendees.length === 0) {
      return ok({ issuedCount: 0, certificates: [] });
    }

    const nowIso = new Date().toISOString();
    const newlyIssued: Certificate[] = [];

    for (const att of eligibleAttendees) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const verificationCode = `DHSGSU-2026-${uniqueSuffix}`;
      const cert: Certificate = {
        _id: `cert-${Date.now()}-${uniqueSuffix}`,
        eventId: event._id,
        eventTitle: event.title,
        userId: att.userId,
        userName: att.userName,
        userRollNumber: att.userRollNumber,
        department: att.userDepartment,
        certificateUrl: `/verify/certificate/${verificationCode}`,
        verificationCode,
        issuedAt: nowIso,
        certificateType: 'PARTICIPATION',
        issueAuthorizedBy: `${event.organizerName}, Faculty Convener`,
        academicAuthority: "Office of the Dean of Students' Welfare (DSW), DHSGSU",
        participationPercent: att.participationPercent ?? 100,
        participatedMinutes: att.participatedMinutes,
      };
      db.certificates.unshift(cert);
      newlyIssued.push(cert);

      const notif: CampusNotification = {
        _id: `notif-cert-${Date.now()}-${uniqueSuffix}`,
        userId: att.userId,
        eventId: event._id,
        type: 'CERTIFICATE_ISSUED',
        title: `Official Certificate Issued: ${event.title}`,
        message: `Your verified DHSGSU participation certificate (${verificationCode}) is now available in your Campus Passport.`,
        read: false,
        createdAt: nowIso,
      };
      db.notifications.unshift(notif);
    }

    recordAuditLog({
      actor: auth.authorized ? auth.user.sub : event.organizerId,
      role: auth.authorized ? auth.user.role : 'organizer',
      action: 'CERTIFICATE_ISSUED',
      entity: 'CampusEvent',
      entityId: event._id,
      metadata: {
        eventTitle: event.title,
        issuedCount: newlyIssued.length,
        minThresholdPercent: minPct,
      },
    });

    await persistSharedDb();
    return ok({ issuedCount: newlyIssued.length, certificates: newlyIssued }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Certificate issuance failed', 500);
  }
}
