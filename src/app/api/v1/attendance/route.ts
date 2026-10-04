import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  generateTemporaryAttendanceTokenString,
} from '../../../../lib/serverStore';
import {
  ok,
  err,
  CORS_HEADERS,
  requireAuth,
  requireAdmin,
} from '../../../../lib/apiMiddleware';
import {
  AttendanceRecord,
  AttendanceSession,
  TemporaryAttendanceToken,
  OnlineAttendanceCheckpoint,
  ScanVerificationResult,
} from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function expireStaleCheckpoints(session: AttendanceSession): boolean {
  if (!Array.isArray(session.checkpoints)) return false;
  let changed = false;
  const nowMs = Date.now();
  for (const cp of session.checkpoints) {
    if (cp.status === 'ACTIVE' && new Date(cp.expiresAt).getTime() < nowMs) {
      cp.status = 'MISSED';
      changed = true;
    }
  }
  return changed;
}

/**
 * GET /api/v1/attendance
 * Returns authoritative attendance records, online sessions, and active student temporary QR / checkpoint state.
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  const userId = searchParams.get('userId') || searchParams.get('studentId');

  // Auto-expire any stale 2-minute online checkpoints
  let dirty = false;
  for (const s of db.attendanceSessions) {
    if (expireStaleCheckpoints(s)) dirty = true;
  }
  if (dirty) {
    await persistSharedDb();
  }

  let records = [...db.attendance];
  if (eventId) records = records.filter(a => a.eventId === eventId);
  if (userId) records = records.filter(a => a.userId === userId || a.studentId === userId);

  let sessions = [...db.attendanceSessions];
  if (eventId) sessions = sessions.filter(s => s.eventId === eventId);
  if (userId) sessions = sessions.filter(s => s.studentId === userId);

  // If student queries their active temporary QR for an offline event
  let activeTempQr: TemporaryAttendanceToken | null = null;
  if (eventId && userId) {
    const nowMs = Date.now();
    activeTempQr =
      db.tempQrTokens.find(
        t =>
          t.eventId === eventId &&
          t.studentId === userId &&
          !t.usedAt &&
          new Date(t.expiresAt).getTime() > nowMs
      ) || null;
  }

  return ok({
    attendance: records,
    sessions,
    activeTempQr,
    total: records.length,
  });
}

/**
 * POST /api/v1/attendance
 * Final Attendance System API (Sections 12–22):
 *
 * OFFLINE / PHYSICAL EVENTS (OFFLINE_QR):
 * - 'generate-temp-qr': Generates a 60-second, one-time, event-specific, student-specific QR token
 * - 'scan-temp-qr' | 'verify-qr': Validates all 8 security rules & marks student PRESENT
 *
 * ONLINE EVENTS (ONLINE_SESSION):
 * - 'online-check-in' | 'join-online': Initial session check-in + server-controlled checkpoint setup
 * - 'poll-checkpoint' | 'trigger-checkpoint': Server-side random checkpoint activation (2-minute validity)
 * - 'verify-checkpoint': Validates student checkpoint submission within the 2-minute window
 *
 * ATTENDANCE WINDOW & ADMIN GOVERNANCE:
 * - 'start-session' | 'open-attendance': Opens event attendance window
 * - 'close-session' | 'finalize-attendance': Finalizes attendance & locks normal organizer edits
 * - 'admin-correct-attendance' | 'mark-roster': Controlled attendance marking / audited Admin correction
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const action = body.action || 'scan-temp-qr';
    const eventId = (body.eventId || '').trim();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const event = db.events.find(e => e._id === eventId);
    if (!event && action !== 'scan-temp-qr') {
      return err('EVENT_NOT_FOUND', 'Target event not found.', 404);
    }

    const totalEventMinutes = event
      ? Math.max(
          15,
          Math.round(
            (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000
          )
        )
      : 60;
    const minPercent = event?.minParticipationPercent ?? 80;
    const requiredMinutes = Math.ceil((totalEventMinutes * minPercent) / 100);
    const policy = event?.onlineAttendancePolicy || {
      initialCheckInRequired: true,
      totalCheckpoints: 3,
      checkpointValiditySeconds: 120, // 2 minutes
      requiredCheckpoints: 2,
      minParticipationPercent: minPercent,
    };

    const actorId = auth.authenticated
      ? auth.user.sub
      : body.actorId || body.studentId || body.userId || event?.organizerId || 'system';
    const actorRole = auth.authenticated ? auth.user.role : 'student';

    const isFinalized =
      event?.attendanceSessionStatus === 'FINALIZED' ||
      event?.attendanceSessionStatus === 'CLOSED';

    // =========================================================================
    // 1. OFFLINE EVENT: STUDENT GENERATES 60-SECOND TEMPORARY QR (Sections 13 & 14)
    // =========================================================================
    if (action === 'generate-temp-qr') {
      if (!event) {
        return err('EVENT_NOT_FOUND', 'Event not found.', 404);
      }

      if (event.eventMode === 'ONLINE') {
        return err(
          'ONLINE_EVENT_NO_QR',
          'Online events use authenticated session check-in and 2-minute checkpoints, not QR codes.',
          400
        );
      }

      const studentId = auth.authenticated ? auth.user.sub : (body.studentId || body.userId || '').trim();
      const student = db.users.find(u => u._id === studentId);
      if (!student || student.status === 'SUSPENDED' || student.status === 'REVOKED') {
        return err('INVALID_STUDENT_ACCOUNT', 'Valid active student account required.', 403);
      }

      const reg = db.registrations.find(
        r => r.eventId === event._id && r.userId === studentId && r.status === 'CONFIRMED'
      );
      if (!reg) {
        return err('NOT_REGISTERED', 'You are not registered for this event.', 403);
      }

      const existingAttendance = db.attendance.find(
        a =>
          a.eventId === event._id &&
          (a.userId === studentId || a.registrationId === reg._id) &&
          a.status === 'PRESENT'
      );
      if (existingAttendance) {
        return err('ALREADY_PRESENT', 'Attendance already recorded for this event.', 409);
      }

      if (isFinalized) {
        return err('ATTENDANCE_FINALIZED', 'Attendance for this event has already closed.', 403);
      }

      // Invalidate any previous unused temporary QR tokens for this student & event
      for (const t of db.tempQrTokens) {
        if (t.eventId === event._id && t.studentId === studentId && !t.usedAt) {
          t.usedAt = nowIso;
        }
      }

      const validitySeconds = 60;
      const expiresAtIso = new Date(nowMs + validitySeconds * 1000).toISOString();
      const tokenString = generateTemporaryAttendanceTokenString(
        event._id,
        studentId,
        reg._id,
        expiresAtIso
      );

      const tempToken: TemporaryAttendanceToken = {
        id: `tqr-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
        token: tokenString,
        eventId: event._id,
        studentId,
        registrationId: reg._id,
        createdAt: nowIso,
        expiresAt: expiresAtIso,
        usedAt: null,
      };

      db.tempQrTokens.unshift(tempToken);
      await persistSharedDb();

      return ok({
        tempQr: tempToken,
        validitySeconds,
      });
    }

    // =========================================================================
    // 2. OFFLINE EVENT: ORGANIZER SCANS STUDENT TEMPORARY QR (Sections 14 & 15)
    // =========================================================================
    if (action === 'scan-temp-qr' || action === 'verify-qr') {
      const rawToken = (body.token || body.qrToken || '').trim();
      if (!rawToken) {
        const result: ScanVerificationResult = {
          status: 'INVALID',
          message: 'Invalid attendance token.',
        };
        return ok({ scanResult: result }, 400);
      }

      if (!event) {
        return err('EVENT_NOT_FOUND', 'Select a valid event before scanning.', 404);
      }

      // Check 6: Event attendance must be open (not finalized)
      if (isFinalized) {
        return err(
          'ATTENDANCE_FINALIZED_LOCKED',
          'Attendance is finalized for this event. Scanning is closed.',
          403
        );
      }

      if (
        event.attendanceSessionStatus !== 'OPEN' &&
        event.attendanceSessionStatus !== 'ACTIVE'
      ) {
        return err(
          'ATTENDANCE_NOT_OPEN',
          'Event attendance is not currently open. Click "Start Attendance" first.',
          400
        );
      }

      // Lookup temporary attendance token first
      const tempToken = db.tempQrTokens.find(
        t => t.token.toUpperCase() === rawToken.toUpperCase()
      );

      if (!tempToken) {
        const result: ScanVerificationResult = {
          status: 'INVALID',
          message: 'Invalid attendance token.',
        };
        return ok({ scanResult: result });
      }

      // Check 4: Token belongs to the correct event
      if (tempToken.eventId !== event._id) {
        const intendedEvt = db.events.find(e => e._id === tempToken.eventId);
        const result: ScanVerificationResult = {
          status: 'WRONG_EVENT',
          message: 'This QR is not valid for this event.',
          intendedEventTitle: intendedEvt?.title,
          currentEventTitle: event.title,
        };
        return ok({ scanResult: result });
      }

      // Check 5: Student is actually registered for that event
      const reg = db.registrations.find(
        r =>
          r._id === tempToken.registrationId &&
          r.eventId === event._id &&
          r.userId === tempToken.studentId &&
          r.status === 'CONFIRMED'
      );

      if (!reg) {
        const result: ScanVerificationResult = {
          status: 'NOT_REGISTERED',
          message: 'Student is not registered for this event.',
        };
        return ok({ scanResult: result });
      }

      // Check 8: Student account is valid/active
      const student = db.users.find(u => u._id === tempToken.studentId);
      if (!student || student.status === 'SUSPENDED' || student.status === 'REVOKED') {
        const result: ScanVerificationResult = {
          status: 'INVALID',
          message: 'Invalid attendance token.',
        };
        return ok({ scanResult: result });
      }

      // Check 7: Student has not already been marked present
      const existingAtt = db.attendance.find(
        a =>
          a.eventId === event._id &&
          (a.userId === student._id || a.registrationId === reg._id) &&
          a.status === 'PRESENT'
      );

      if (existingAtt) {
        const result: ScanVerificationResult = {
          status: 'ALREADY_PRESENT',
          message: 'Attendance already recorded.',
          registration: reg,
          event,
          attendee: student,
          checkedInAt: existingAtt.checkedInAt,
        };
        return ok({ scanResult: result });
      }

      // Check 2 & 3: Token has not expired AND has not already been used
      const isExpired = new Date(tempToken.expiresAt).getTime() < nowMs;
      if (tempToken.usedAt || isExpired) {
        const result: ScanVerificationResult = {
          status: 'EXPIRED',
          message: 'QR expired. Ask the student to generate a new attendance QR.',
        };
        return ok({ scanResult: result });
      }

      // Mark temporary QR token as used immediately (one-time use)
      tempToken.usedAt = nowIso;
      reg.checkedInAt = nowIso;

      const newRecord: AttendanceRecord = {
        _id: `att-qr-${nowMs}-${reg._id}`,
        eventId: event._id,
        registrationId: reg._id,
        userId: student._id,
        studentId: student._id,
        userName: reg.userName,
        userRollNumber: reg.userRollNumber,
        userDepartment: reg.userDepartment,
        attendanceType: 'OFFLINE_QR',
        status: 'PRESENT',
        checkedInAt: nowIso,
        checkedInBy: actorId,
        method: 'qr',
        participatedMinutes: totalEventMinutes,
        requiredMinutes,
        totalEventMinutes,
        participationPercent: 100,
        sessionStatus: 'COMPLETED',
        lastValidatedAt: nowIso,
        eligibleForCertificate: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.attendance.unshift(newRecord);

      recordAuditLog({
        actor: actorId,
        role: actorRole,
        action: 'ATTENDANCE_CHECKIN',
        entity: 'AttendanceRecord',
        entityId: newRecord._id,
        metadata: {
          eventId: event._id,
          studentId: student._id,
          studentName: student.name,
          rollNumber: reg.userRollNumber,
          attendanceType: 'OFFLINE_QR',
        },
      });

      await persistSharedDb();

      const successResult: ScanVerificationResult = {
        status: 'SUCCESS',
        message: 'Attendance marked successfully.',
        registration: reg,
        event,
        attendee: student,
      };

      return ok({
        scanResult: successResult,
        attendanceRecord: newRecord,
        attendance: db.attendance.filter(a => a.eventId === event._id),
      });
    }

    // =========================================================================
    // 3. ONLINE EVENT: INITIAL CHECK-IN & 2-MINUTE CHECKPOINTS (Sections 17–19)
    // =========================================================================
    if (
      action === 'online-check-in' ||
      action === 'join-online' ||
      action === 'poll-checkpoint' ||
      action === 'trigger-checkpoint' ||
      action === 'verify-checkpoint' ||
      action === 'leave-online'
    ) {
      if (!event) {
        return err('EVENT_NOT_FOUND', 'Event not found.', 404);
      }

      const studentId = auth.authenticated
        ? auth.user.sub
        : (body.studentId || body.userId || '').trim();

      // Allow organizer/admin to trigger a random checkpoint across all active online sessions for the event
      if (action === 'trigger-checkpoint' && !studentId && (actorRole === 'organizer' || actorRole === 'admin')) {
        const activeSessions = db.attendanceSessions.filter(
          s => s.eventId === event._id && s.status === 'ACTIVE'
        );
        let triggeredCount = 0;
        for (const sess of activeSessions) {
          expireStaleCheckpoints(sess);
          const checkpoints = Array.isArray(sess.checkpoints) ? [...sess.checkpoints] : [];
          const hasActive = checkpoints.some(c => c.status === 'ACTIVE');
          if (!hasActive && checkpoints.length < policy.totalCheckpoints) {
            const nextNum = checkpoints.length + 1;
            const cp: OnlineAttendanceCheckpoint = {
              id: `cp-${nowMs}-${sess.studentId}-${nextNum}`,
              sessionId: sess.id,
              eventId: event._id,
              studentId: sess.studentId || '',
              checkpointNumber: nextNum,
              triggeredAt: nowIso,
              expiresAt: new Date(nowMs + policy.checkpointValiditySeconds * 1000).toISOString(),
              verifiedAt: null,
              status: 'ACTIVE',
            };
            checkpoints.push(cp);
            sess.checkpoints = checkpoints;
            sess.updatedAt = nowIso;
            triggeredCount++;
          }
        }
        await persistSharedDb();
        return ok({ triggeredCount, sessions: activeSessions });
      }

      const reg = db.registrations.find(
        r => r.eventId === event._id && r.userId === studentId && r.status === 'CONFIRMED'
      );
      if (!reg) {
        return err(
          'NOT_REGISTERED',
          'You are not registered for this event.',
          403
        );
      }

      let session = db.attendanceSessions.find(
        s => s.eventId === event._id && s.studentId === studentId
      );

      // Initial Check-In
      if (!session) {
        if (action === 'verify-checkpoint') {
          return err('NO_ACTIVE_SESSION', 'Join the online event session first.', 400);
        }

        // Server schedules/activates Checkpoint #1 with a strict 2-minute (120s) verification window
        const firstCheckpoint: OnlineAttendanceCheckpoint = {
          id: `cp-${nowMs}-${studentId}-1`,
          sessionId: `osess-${nowMs}-${studentId}`,
          eventId: event._id,
          studentId,
          checkpointNumber: 1,
          triggeredAt: nowIso,
          expiresAt: new Date(nowMs + policy.checkpointValiditySeconds * 1000).toISOString(),
          verifiedAt: null,
          status: 'ACTIVE',
        };

        session = {
          id: `osess-${nowMs}-${studentId}`,
          eventId: event._id,
          studentId,
          registrationId: reg._id,
          joinedAt: nowIso,
          verifiedDuration: 15,
          mode: event.eventMode || 'ONLINE',
          minimumParticipationPercent: minPercent,
          checkpoints: [firstCheckpoint],
          checkpointsVerified: 0,
          checkpointsRequired: policy.requiredCheckpoints,
          checkpointsTotal: policy.totalCheckpoints,
          status: 'ACTIVE',
          deviceId: body.deviceId || 'web-session',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.attendanceSessions.unshift(session);

        recordAuditLog({
          actor: studentId,
          actorName: reg.userName,
          role: 'student',
          action: 'ONLINE_SESSION_JOINED',
          entity: 'AttendanceSession',
          entityId: session.id,
          metadata: { eventId: event._id, checkpointTriggered: 1 },
        });
      } else {
        expireStaleCheckpoints(session);
      }

      const checkpoints = Array.isArray(session.checkpoints) ? [...session.checkpoints] : [];

      // Trigger next server-controlled checkpoint if requested
      if (action === 'trigger-checkpoint') {
        const activeCp = checkpoints.find(c => c.status === 'ACTIVE');
        if (!activeCp && checkpoints.length < policy.totalCheckpoints) {
          const nextNum = checkpoints.length + 1;
          const newCp: OnlineAttendanceCheckpoint = {
            id: `cp-${nowMs}-${studentId}-${nextNum}`,
            sessionId: session.id,
            eventId: event._id,
            studentId,
            checkpointNumber: nextNum,
            triggeredAt: nowIso,
            expiresAt: new Date(nowMs + policy.checkpointValiditySeconds * 1000).toISOString(),
            verifiedAt: null,
            status: 'ACTIVE',
          };
          checkpoints.push(newCp);
          session.checkpoints = checkpoints;
          session.updatedAt = nowIso;

          recordAuditLog({
            actor: studentId,
            actorName: reg.userName,
            role: 'student',
            action: 'ONLINE_CHECKPOINT_TRIGGERED',
            entity: 'AttendanceSession',
            entityId: session.id,
            metadata: { eventId: event._id, checkpointNumber: nextNum, expiresAt: newCp.expiresAt },
          });
        }
      }

      // Verify active 2-minute checkpoint (Section 18)
      if (action === 'verify-checkpoint') {
        const checkpointId = (body.checkpointId || '').trim();
        const targetCp = checkpointId
          ? checkpoints.find(c => c.id === checkpointId)
          : checkpoints.find(c => c.status === 'ACTIVE');

        if (!targetCp) {
          return err(
            'NO_ACTIVE_CHECKPOINT',
            'No active attendance verification checkpoint found for your session.',
            400
          );
        }

        if (targetCp.studentId !== studentId || targetCp.eventId !== event._id) {
          return err('FORBIDDEN_CHECKPOINT', 'This checkpoint does not belong to your session.', 403);
        }

        if (targetCp.status === 'VERIFIED') {
          return err(
            'DUPLICATE_CHECKPOINT',
            'This attendance checkpoint has already been completed.',
            409
          );
        }

        if (targetCp.status === 'MISSED' || new Date(targetCp.expiresAt).getTime() < nowMs) {
          targetCp.status = 'MISSED';
          session.checkpoints = checkpoints;
          await persistSharedDb();
          return err(
            'CHECKPOINT_EXPIRED',
            'Attendance verification expired (2-minute limit exceeded). This checkpoint was marked missed.',
            400
          );
        }

        // Valid submission within 2-minute window!
        targetCp.status = 'VERIFIED';
        targetCp.verifiedAt = nowIso;
        session.checkpoints = checkpoints;

        recordAuditLog({
          actor: studentId,
          actorName: reg.userName,
          role: 'student',
          action: 'ONLINE_CHECKPOINT_VERIFIED',
          entity: 'AttendanceSession',
          entityId: session.id,
          metadata: {
            eventId: event._id,
            checkpointId: targetCp.id,
            checkpointNumber: targetCp.checkpointNumber,
          },
        });
      }

      if (action === 'leave-online') {
        session.status = 'ENDED';
        session.leftAt = nowIso;
      }

      // Authoritative server-side calculation of online participation & certificate eligibility (Sections 18, 19, 21)
      const verifiedCheckpointsCount = checkpoints.filter(c => c.status === 'VERIFIED').length;
      const requiredCheckpointsCount = Math.max(1, policy.requiredCheckpoints || 2);
      const totalCheckpointsCount = Math.max(requiredCheckpointsCount, policy.totalCheckpoints || 3);

      session.checkpointsVerified = verifiedCheckpointsCount;
      session.checkpointsRequired = requiredCheckpointsCount;
      session.checkpointsTotal = totalCheckpointsCount;

      const checkpointRatio = Math.min(1, verifiedCheckpointsCount / requiredCheckpointsCount);
      const calculatedPercent = Math.min(100, Math.round(checkpointRatio * 100));
      const calculatedMinutes = Math.round((totalEventMinutes * calculatedPercent) / 100);
      const isEligible = verifiedCheckpointsCount >= requiredCheckpointsCount;

      session.verifiedDuration = calculatedMinutes;
      session.updatedAt = nowIso;

      const attIdx = db.attendance.findIndex(
        a => a.eventId === event._id && (a.userId === studentId || a.studentId === studentId)
      );

      const attRec: AttendanceRecord = {
        _id: attIdx !== -1 ? db.attendance[attIdx]._id : `att-onl-${nowMs}-${studentId}`,
        eventId: event._id,
        registrationId: reg._id,
        userId: studentId,
        studentId,
        userName: reg.userName,
        userRollNumber: reg.userRollNumber,
        userDepartment: reg.userDepartment,
        attendanceType: 'ONLINE_SESSION',
        status: isEligible ? 'PRESENT' : 'IN_PROGRESS',
        checkedInAt: session.joinedAt || nowIso,
        checkedOutAt: session.leftAt,
        checkedInBy: studentId,
        method: 'online_session',
        checkpointsVerified: verifiedCheckpointsCount,
        checkpointsRequired: requiredCheckpointsCount,
        checkpointsTotal: totalCheckpointsCount,
        checkpoints,
        participatedMinutes: calculatedMinutes,
        requiredMinutes,
        totalEventMinutes,
        participationPercent: calculatedPercent,
        sessionStatus:
          isEligible ? 'COMPLETED' : action === 'leave-online' ? 'ENDED' : 'ACTIVE',
        lastValidatedAt: nowIso,
        eligibleForCertificate: isEligible,
        createdAt: attIdx !== -1 ? db.attendance[attIdx].createdAt : nowIso,
        updatedAt: nowIso,
      };

      if (attIdx !== -1) {
        db.attendance[attIdx] = attRec;
      } else {
        db.attendance.unshift(attRec);
      }

      if (isEligible) {
        reg.checkedInAt = session.joinedAt || nowIso;
      }

      await persistSharedDb();
      return ok({
        session,
        attendance: attRec,
        activeCheckpoint: checkpoints.find(c => c.status === 'ACTIVE') || null,
        policy,
      });
    }

    // =========================================================================
    // 4. OPEN / START ATTENDANCE WINDOW (Section 16)
    // =========================================================================
    if (action === 'start-session' || action === 'open-attendance') {
      if (!event) return err('EVENT_NOT_FOUND', 'Event not found.', 404);
      if (isFinalized && actorRole !== 'admin') {
        return err(
          'ATTENDANCE_ALREADY_FINALIZED',
          'Attendance is already finalized for this event. Only University Administration can reopen or correct finalized records.',
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

    // =========================================================================
    // 5. FINALIZE / CLOSE ATTENDANCE WINDOW (Section 16)
    // =========================================================================
    if (action === 'close-session' || action === 'finalize-attendance') {
      if (!event) return err('EVENT_NOT_FOUND', 'Event not found.', 404);

      event.attendanceSessionStatus = 'FINALIZED';
      event.attendanceClosedAt = nowIso;
      event.attendanceFinalizedAt = nowIso;
      event.attendanceFinalizedBy = actorId;
      event.status = 'COMPLETED';
      event.updatedAt = nowIso;

      db.attendance = db.attendance.map(att => {
        if (att.eventId !== event._id) return att;
        const isOnline = att.attendanceType === 'ONLINE_SESSION' || att.method === 'online_session';
        const eligible = isOnline
          ? (att.checkpointsVerified ?? 0) >= (att.checkpointsRequired ?? policy.requiredCheckpoints)
          : att.status === 'PRESENT';

        return {
          ...att,
          status: eligible ? 'PRESENT' : 'ABSENT',
          sessionStatus: 'COMPLETED',
          finalizedAt: nowIso,
          finalizedBy: actorId,
          eligibleForCertificate: eligible,
          updatedAt: nowIso,
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
          presentCount: db.attendance.filter(a => a.eventId === event._id && a.status === 'PRESENT').length,
        },
      });

      await persistSharedDb();
      return ok({ event, attendance: db.attendance.filter(a => a.eventId === event._id) });
    }

    // =========================================================================
    // 6. ADMIN ATTENDANCE CORRECTION & AUTHORIZED OVERRIDE (Section 22)
    // =========================================================================
    if (action === 'admin-correct-attendance' || action === 'mark-roster') {
      if (!event) return err('EVENT_NOT_FOUND', 'Event not found.', 404);

      // If event is finalized or action is explicitly admin-correct-attendance, enforce MANAGE_ATTENDANCE admin permission
      if (isFinalized || action === 'admin-correct-attendance') {
        const adminCheck = requireAdmin(req, 'MANAGE_ATTENDANCE');
        if (!adminCheck.authorized) {
          return err(
            'FORBIDDEN_ATTENDANCE_CORRECTION',
            isFinalized
              ? 'Attendance is finalized. Normal organizer edits are locked; only an authorized Administrator (MANAGE_ATTENDANCE) can make corrections.'
              : 'You do not have permission to perform administrative attendance corrections.',
            403
          );
        }
      } else if (actorRole !== 'organizer' && actorRole !== 'admin') {
        return err('FORBIDDEN', 'You do not have permission to mark attendance.', 403);
      }

      const registrationId = body.registrationId;
      const userId = body.userId || body.studentId;
      const markStatus: 'PRESENT' | 'ABSENT' =
        body.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';

      const reg = db.registrations.find(
        r =>
          r.eventId === event._id &&
          r.status === 'CONFIRMED' &&
          (r._id === registrationId || r.userId === userId)
      );

      if (!reg) {
        return err('REGISTRATION_NOT_FOUND', 'Student registration not found for this event.', 404);
      }

      const existingIdx = db.attendance.findIndex(
        a => a.eventId === event._id && (a.registrationId === reg._id || a.userId === reg.userId)
      );

      if (markStatus === 'ABSENT') {
        if (existingIdx !== -1) {
          db.attendance.splice(existingIdx, 1);
        }
        reg.checkedInAt = null;
      } else {
        const isOnlineEvent = event.eventMode === 'ONLINE';
        const record: AttendanceRecord = {
          _id: existingIdx !== -1 ? db.attendance[existingIdx]._id : `att-${nowMs}-${reg._id}`,
          eventId: event._id,
          registrationId: reg._id,
          userId: reg.userId,
          studentId: reg.userId,
          userName: reg.userName,
          userRollNumber: reg.userRollNumber,
          userDepartment: reg.userDepartment,
          attendanceType: isOnlineEvent ? 'ONLINE_SESSION' : 'OFFLINE_QR',
          status: 'PRESENT',
          checkedInAt: nowIso,
          checkedInBy: actorId,
          method: actorRole === 'admin' ? 'admin_override' : 'qr',
          checkpointsVerified: isOnlineEvent ? policy.requiredCheckpoints : undefined,
          checkpointsRequired: isOnlineEvent ? policy.requiredCheckpoints : undefined,
          checkpointsTotal: isOnlineEvent ? policy.totalCheckpoints : undefined,
          participatedMinutes: totalEventMinutes,
          requiredMinutes,
          totalEventMinutes,
          participationPercent: 100,
          sessionStatus: 'COMPLETED',
          lastValidatedAt: nowIso,
          eligibleForCertificate: true,
          finalizedAt: isFinalized ? nowIso : undefined,
          finalizedBy: isFinalized ? actorId : undefined,
          createdAt: existingIdx !== -1 ? db.attendance[existingIdx].createdAt : nowIso,
          updatedAt: nowIso,
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
        adminLevel: auth.authenticated ? auth.user.adminLevel : undefined,
        action: actorRole === 'admin' ? 'ATTENDANCE_CORRECTED' : 'ATTENDANCE_MARKED',
        entity: 'AttendanceRecord',
        entityId: reg._id,
        metadata: {
          eventId: event._id,
          studentId: reg.userId,
          studentName: reg.userName,
          rollNumber: reg.userRollNumber,
          status: markStatus,
          wasFinalized: isFinalized,
          reason: body.reason || 'Administrative attendance correction',
        },
      });

      await persistSharedDb();
      return ok({
        status: markStatus,
        registration: reg,
        attendance: db.attendance.filter(a => a.eventId === event._id),
      });
    }

    return err('UNSUPPORTED_ACTION', `Action "${action}" is not supported.`, 400);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Attendance operation failed', 500);
  }
}

/**
 * PATCH /api/v1/attendance
 * Audited Administrative Attendance Correction (Requires MANAGE_ATTENDANCE if finalized).
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.authenticated) return auth.response;

    const db = await loadSharedDbAsync();
    const body = await req.json();
    const attendanceId = body.attendanceId || body._id;
    const attIdx = db.attendance.findIndex(a => a._id === attendanceId);
    if (attIdx === -1) {
      return err('NOT_FOUND', 'Attendance record not found.', 404);
    }

    const att = db.attendance[attIdx];
    const event = db.events.find(e => e._id === att.eventId);
    const isFinalized =
      event?.attendanceSessionStatus === 'FINALIZED' ||
      event?.attendanceSessionStatus === 'CLOSED';

    if (isFinalized) {
      const adminCheck = requireAdmin(req, 'MANAGE_ATTENDANCE');
      if (!adminCheck.authorized) {
        return err(
          'ATTENDANCE_FINALIZED_LOCKED',
          'Attendance is finalized. Only an authorized Administrator (MANAGE_ATTENDANCE) can modify finalized attendance.',
          403
        );
      }
    }

    const totalMins = att.totalEventMinutes || 60;
    const minPct = event?.minParticipationPercent ?? 80;
    const participatedMinutes = Number(body.participatedMinutes ?? att.participatedMinutes ?? totalMins);
    const clampedMins = Math.max(0, Math.min(totalMins, participatedMinutes));
    const pct = Math.min(100, Math.round((clampedMins / totalMins) * 100));
    const eligible = pct >= minPct;
    const nowIso = new Date().toISOString();

    const updatedAtt: AttendanceRecord = {
      ...att,
      status: eligible ? 'PRESENT' : 'ABSENT',
      participatedMinutes: clampedMins,
      totalEventMinutes: totalMins,
      requiredMinutes: Math.ceil((totalMins * minPct) / 100),
      participationPercent: pct,
      sessionStatus: body.sessionStatus || (pct >= 100 ? 'COMPLETED' : att.sessionStatus),
      lastValidatedAt: nowIso,
      eligibleForCertificate: eligible,
      updatedAt: nowIso,
    };

    db.attendance[attIdx] = updatedAtt;

    if (auth.user.role === 'admin') {
      recordAuditLog({
        actor: auth.user.sub,
        actorName: auth.user.email,
        role: 'admin',
        adminLevel: auth.user.adminLevel,
        action: 'ATTENDANCE_CORRECTED',
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
