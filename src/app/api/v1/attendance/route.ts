import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth } from '../../../../lib/apiMiddleware';
import { AttendanceRecord, AttendanceSession } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/attendance
 * Returns attendance records and online/offline sessions filtered by eventId or userId.
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  const userId = searchParams.get('userId');

  let records = [...db.attendance];
  if (eventId) records = records.filter(a => a.eventId === eventId);
  if (userId) records = records.filter(a => a.userId === userId);

  const sessions = eventId
    ? db.attendanceSessions.filter(s => s.eventId === eventId)
    : db.attendanceSessions;

  return ok({ attendance: records, sessions, total: records.length });
}

/**
 * POST /api/v1/attendance
 * Roster-based Offline Attendance & Authenticated Online Participation Session API (Zero QR)
 * Actions:
 * - 'start-session' | 'open-attendance': Opens attendance for an event
 * - 'mark-roster': Marks a registered student PRESENT or ABSENT (or Admin override after finalization)
 * - 'mark-all-present': Marks all registered students PRESENT (reversible prior to finalization)
 * - 'reset-roster': Clears/undoes attendance marks prior to finalization
 * - 'close-session' | 'finalize-attendance': Finalizes attendance (locks normal organizer edits)
 * - 'join-online': Starts/resumes an authenticated student online participation session
 * - 'validate-online': Server-validated online session heartbeat
 * - 'leave-online': Ends an online participation session and computes server-verified duration
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const action = body.action || 'mark-roster';
    const eventId = (body.eventId || '').trim();

    const event = db.events.find(e => e._id === eventId);
    if (!event) {
      return err('EVENT_NOT_FOUND', 'Target event not found.', 404);
    }

    const totalEventMinutes = Math.max(
      15,
      Math.round(
        (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000
      )
    );
    const minPercent = event.minParticipationPercent ?? 80;
    const requiredMinutes = Math.ceil((totalEventMinutes * minPercent) / 100);
    const nowIso = new Date().toISOString();
    const actorId = auth.authenticated ? auth.user.sub : body.actorId || event.organizerId;
    const actorRole = auth.authenticated ? auth.user.role : body.actorRole || 'organizer';

    const isFinalized =
      event.attendanceSessionStatus === 'FINALIZED' ||
      event.attendanceSessionStatus === 'CLOSED';

    // 1. OPEN / START ATTENDANCE
    if (action === 'start-session' || action === 'open-attendance') {
      if (isFinalized && actorRole !== 'admin') {
        return err(
          'ATTENDANCE_ALREADY_FINALIZED',
          'Attendance is already finalized for this event. Only University Administration can reopen or override finalized records.',
          403
        );
      }

      event.attendanceSessionStatus = 'OPEN';
      event.attendanceStartedAt = nowIso;
      if (event.status === 'PUBLISHED' || event.status === 'APPROVED') {
        event.status = 'ONGOING';
      }
      event.updatedAt = nowIso;

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action: 'ATTENDANCE_STARTED',
        entity: 'CampusEvent',
        entityId: event._id,
        metadata: { eventTitle: event.title, status: 'OPEN' },
      });

      await persistSharedDb();
      return ok({ event });
    }

    // 2. MARK SINGLE STUDENT PRESENT / ABSENT ON ROSTER
    if (action === 'mark-roster') {
      if (isFinalized && actorRole !== 'admin') {
        return err(
          'ATTENDANCE_FINALIZED_LOCKED',
          'Attendance has been finalized for this event. Normal organizer edits are no longer allowed.',
          403
        );
      }

      const registrationId = body.registrationId;
      const userId = body.userId;
      const markStatus: 'PRESENT' | 'ABSENT' =
        body.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';

      const reg = db.registrations.find(
        r =>
          r.eventId === eventId &&
          r.status === 'CONFIRMED' &&
          (r._id === registrationId || r.userId === userId)
      );

      if (!reg) {
        return err('REGISTRATION_NOT_FOUND', 'Student registration not found on event roster.', 404);
      }

      const existingIdx = db.attendance.findIndex(
        a => a.eventId === eventId && (a.registrationId === reg._id || a.userId === reg.userId)
      );

      if (markStatus === 'ABSENT') {
        if (existingIdx !== -1) {
          db.attendance.splice(existingIdx, 1);
        }
        reg.checkedInAt = null;
      } else {
        const method = isFinalized && actorRole === 'admin' ? 'admin_override' : 'roster';
        const record: AttendanceRecord = {
          _id: existingIdx !== -1 ? db.attendance[existingIdx]._id : `att-${Date.now()}-${reg._id}`,
          eventId,
          registrationId: reg._id,
          userId: reg.userId,
          userName: reg.userName,
          userRollNumber: reg.userRollNumber,
          userDepartment: reg.userDepartment,
          status: 'PRESENT',
          checkedInAt: nowIso,
          checkedInBy: actorId,
          method,
          participatedMinutes: totalEventMinutes,
          requiredMinutes,
          totalEventMinutes,
          participationPercent: 100,
          sessionStatus: 'COMPLETED',
          lastValidatedAt: nowIso,
          eligibleForCertificate: true,
        };

        if (existingIdx !== -1) {
          db.attendance[existingIdx] = record;
        } else {
          db.attendance.unshift(record);
        }
        reg.checkedInAt = nowIso;
      }

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action:
          isFinalized && actorRole === 'admin'
            ? 'ATTENDANCE_ADMIN_OVERRIDE'
            : 'ATTENDANCE_MARKED',
        entity: 'AttendanceRecord',
        entityId: reg._id,
        metadata: {
          eventId,
          studentName: reg.userName,
          rollNumber: reg.userRollNumber,
          status: markStatus,
          adminOverride: isFinalized && actorRole === 'admin',
        },
      });

      await persistSharedDb();
      return ok({
        status: markStatus,
        registration: reg,
        attendance: db.attendance.filter(a => a.eventId === eventId),
      });
    }

    // 3. MARK ALL PRESENT (Reversible before finalization)
    if (action === 'mark-all-present') {
      if (isFinalized && actorRole !== 'admin') {
        return err(
          'ATTENDANCE_FINALIZED_LOCKED',
          'Attendance is finalized. Bulk changes are locked.',
          403
        );
      }

      const eventRegs = db.registrations.filter(
        r => r.eventId === eventId && r.status === 'CONFIRMED'
      );

      for (const reg of eventRegs) {
        const existingIdx = db.attendance.findIndex(
          a => a.eventId === eventId && (a.registrationId === reg._id || a.userId === reg.userId)
        );
        const rec: AttendanceRecord = {
          _id: existingIdx !== -1 ? db.attendance[existingIdx]._id : `att-${Date.now()}-${reg._id}`,
          eventId,
          registrationId: reg._id,
          userId: reg.userId,
          userName: reg.userName,
          userRollNumber: reg.userRollNumber,
          userDepartment: reg.userDepartment,
          status: 'PRESENT',
          checkedInAt: nowIso,
          checkedInBy: actorId,
          method: 'roster',
          participatedMinutes: totalEventMinutes,
          requiredMinutes,
          totalEventMinutes,
          participationPercent: 100,
          sessionStatus: 'COMPLETED',
          lastValidatedAt: nowIso,
          eligibleForCertificate: true,
        };
        if (existingIdx !== -1) {
          db.attendance[existingIdx] = rec;
        } else {
          db.attendance.unshift(rec);
        }
        reg.checkedInAt = nowIso;
      }

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action: 'ATTENDANCE_MARKED',
        entity: 'CampusEvent',
        entityId: eventId,
        metadata: { bulkAction: 'MARK_ALL_PRESENT', count: eventRegs.length },
      });

      await persistSharedDb();
      return ok({
        markedCount: eventRegs.length,
        attendance: db.attendance.filter(a => a.eventId === eventId),
      });
    }

    // 4. RESET / UNDO ROSTER ATTENDANCE (Before finalization)
    if (action === 'reset-roster') {
      if (isFinalized && actorRole !== 'admin') {
        return err(
          'ATTENDANCE_FINALIZED_LOCKED',
          'Attendance is finalized and cannot be reset by organizer.',
          403
        );
      }

      db.attendance = db.attendance.filter(a => a.eventId !== eventId);
      db.registrations = db.registrations.map(r =>
        r.eventId === eventId ? { ...r, checkedInAt: null } : r
      );

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action: 'ATTENDANCE_MARKED',
        entity: 'CampusEvent',
        entityId: eventId,
        metadata: { bulkAction: 'RESET_ROSTER' },
      });

      await persistSharedDb();
      return ok({ reset: true, attendance: [] });
    }

    // 5. FINALIZE / CLOSE ATTENDANCE
    if (action === 'close-session' || action === 'finalize-attendance') {
      event.attendanceSessionStatus = 'FINALIZED';
      event.attendanceClosedAt = nowIso;
      event.attendanceFinalizedAt = nowIso;
      event.attendanceFinalizedBy = actorId;
      event.updatedAt = nowIso;

      db.attendance = db.attendance.map(att => {
        if (att.eventId !== event._id) return att;
        const pMins =
          att.method === 'roster' || att.method === 'admin_override'
            ? totalEventMinutes
            : att.participatedMinutes ?? totalEventMinutes;
        const pct = Math.min(100, Math.round((pMins / totalEventMinutes) * 100));
        return {
          ...att,
          status: 'PRESENT',
          participatedMinutes: pMins,
          totalEventMinutes,
          requiredMinutes,
          participationPercent: pct,
          sessionStatus: 'COMPLETED',
          lastValidatedAt: nowIso,
          eligibleForCertificate: pct >= minPercent,
        };
      });

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action: 'ATTENDANCE_FINALIZED',
        entity: 'CampusEvent',
        entityId: event._id,
        metadata: {
          title: event.title,
          attendanceFinalizedAt: nowIso,
          attendanceFinalizedBy: actorId,
          presentCount: db.attendance.filter(a => a.eventId === event._id).length,
        },
      });

      await persistSharedDb();
      return ok({ event, attendance: db.attendance.filter(a => a.eventId === event._id) });
    }

    // 6. ONLINE EVENT PARTICIPATION SESSION (Join / Validate / Leave)
    if (action === 'join-online' || action === 'validate-online' || action === 'leave-online') {
      const studentId = auth.authenticated ? auth.user.sub : body.userId || body.studentId;
      const reg = db.registrations.find(
        r => r.eventId === eventId && r.userId === studentId && r.status === 'CONFIRMED'
      );
      if (!reg) {
        return err('NOT_REGISTERED', 'You must be registered for this event to join the online session.', 403);
      }

      let session = db.attendanceSessions.find(
        s => s.eventId === eventId && s.studentId === studentId
      );

      if (!session) {
        session = {
          id: `osess-${Date.now()}-${studentId}`,
          eventId,
          studentId,
          registrationId: reg._id,
          joinedAt: nowIso,
          verifiedDuration: 15,
          mode: event.eventMode || 'ONLINE',
          minimumParticipationPercent: minPercent,
          status: action === 'leave-online' ? 'ENDED' : 'ACTIVE',
          deviceId: body.deviceId || 'web-session',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.attendanceSessions.unshift(session);
      } else {
        // Server calculates elapsed verified minutes from joinedAt / last update + validated increment
        const elapsedSinceJoin = session.joinedAt
          ? Math.max(1, Math.round((Date.now() - new Date(session.joinedAt).getTime()) / 60000))
          : 15;
        const validatedIncrement = action === 'validate-online' ? 30 : 0;
        const nextVerified = Math.min(
          totalEventMinutes,
          Math.max((session.verifiedDuration || 0) + validatedIncrement, elapsedSinceJoin)
        );
        session.verifiedDuration = nextVerified;
        session.status = action === 'leave-online' ? 'ENDED' : 'ACTIVE';
        if (action === 'leave-online') {
          session.leftAt = nowIso;
        }
        session.updatedAt = nowIso;
      }

      const verifiedMins = session.verifiedDuration || 15;
      const pct = Math.min(100, Math.round((verifiedMins / totalEventMinutes) * 100));
      const eligible = verifiedMins >= requiredMinutes;

      const attIdx = db.attendance.findIndex(
        a => a.eventId === eventId && a.userId === studentId
      );
      const attRec: AttendanceRecord = {
        _id: attIdx !== -1 ? db.attendance[attIdx]._id : `att-onl-${Date.now()}`,
        eventId,
        registrationId: reg._id,
        userId: studentId,
        userName: reg.userName,
        userRollNumber: reg.userRollNumber,
        userDepartment: reg.userDepartment,
        status: 'PRESENT',
        checkedInAt: session.joinedAt || nowIso,
        checkedInBy: studentId,
        method: 'online_session',
        participatedMinutes: verifiedMins,
        requiredMinutes,
        totalEventMinutes,
        participationPercent: pct,
        sessionStatus: action === 'leave-online' ? 'ENDED' : 'ACTIVE',
        lastValidatedAt: nowIso,
        eligibleForCertificate: eligible,
      };

      if (attIdx !== -1) {
        db.attendance[attIdx] = attRec;
      } else {
        db.attendance.unshift(attRec);
      }
      reg.checkedInAt = session.joinedAt || nowIso;

      recordAuditLog({
        actor: studentId,
        actorName: reg.userName,
        role: 'student',
        action: action === 'leave-online' ? 'ONLINE_SESSION_LEFT' : 'ONLINE_SESSION_JOINED',
        entity: 'AttendanceSession',
        entityId: session.id,
        metadata: {
          eventId,
          verifiedDuration: verifiedMins,
          requiredMinutes,
          eligibleForCertificate: eligible,
        },
      });

      await persistSharedDb();
      return ok({ session, attendance: attRec });
    }

    return err('UNSUPPORTED_ACTION', `Action "${action}" is not supported.`, 400);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Attendance operation failed', 500);
  }
}

/**
 * PATCH /api/v1/attendance
 * Server-side participation duration update / Admin override with audit logging.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const attendanceId = body.attendanceId || body._id;
    const participatedMinutes = Number(body.participatedMinutes);

    const attIdx = db.attendance.findIndex(a => a._id === attendanceId);
    if (attIdx === -1) {
      return err('NOT_FOUND', 'Attendance record not found.', 404);
    }

    const att = db.attendance[attIdx];
    const event = db.events.find(e => e._id === att.eventId);
    const isFinalized =
      event?.attendanceSessionStatus === 'FINALIZED' ||
      event?.attendanceSessionStatus === 'CLOSED';
    const actorRole = auth.authenticated ? auth.user.role : body.actorRole || 'organizer';

    if (isFinalized && actorRole !== 'admin') {
      return err(
        'ATTENDANCE_FINALIZED_LOCKED',
        'Attendance is finalized. Only University Administration can override finalized attendance.',
        403
      );
    }

    const totalMins =
      att.totalEventMinutes ||
      (event
        ? Math.max(
            15,
            Math.round(
              (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000
            )
          )
        : 60);
    const minPct = event?.minParticipationPercent ?? 80;
    const clampedMins = Math.max(0, Math.min(totalMins, participatedMinutes));
    const pct = Math.min(100, Math.round((clampedMins / totalMins) * 100));
    const eligible = pct >= minPct;

    const updatedAtt: AttendanceRecord = {
      ...att,
      participatedMinutes: clampedMins,
      totalEventMinutes: totalMins,
      requiredMinutes: Math.ceil((totalMins * minPct) / 100),
      participationPercent: pct,
      sessionStatus: body.sessionStatus || (pct >= 100 ? 'COMPLETED' : att.sessionStatus),
      lastValidatedAt: new Date().toISOString(),
      eligibleForCertificate: eligible,
    };

    db.attendance[attIdx] = updatedAtt;

    if (isFinalized && actorRole === 'admin') {
      recordAuditLog({
        actor: auth.authenticated ? auth.user.sub : 'admin-1',
        role: 'admin',
        action: 'ATTENDANCE_ADMIN_OVERRIDE',
        entity: 'AttendanceRecord',
        entityId: updatedAtt._id,
        metadata: {
          studentName: updatedAtt.userName,
          participatedMinutes: clampedMins,
          eligibleForCertificate: eligible,
        },
      });
    }

    await persistSharedDb();
    return ok({ attendance: updatedAtt });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to update attendance', 500);
  }
}
