import { NextRequest, NextResponse } from 'next/server';
import {
  getSharedDb,
  loadSharedDbAsync,
  persistSharedDb,
  createAuthToken,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  recordAuditLog,
} from '../../../../lib/serverStore';
import { CORS_HEADERS } from '../../../../lib/apiMiddleware';
import { User, OrganizerVerificationRequest } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/auth
 * Returns the sanitized shared PARISAR database snapshot (users without passwordHash,
 * organizerRequests, venues, events, registrations, attendance, certificates, notifications, auditLogs)
 * so Web and Android share the exact same single source of truth.
 */
export async function GET() {
  const db = await loadSharedDbAsync();
  return NextResponse.json(
    {
      success: true,
      data: {
        users: db.users.map(sanitizeUser),
        organizerRequests: db.organizerRequests,
        venues: db.venues,
        events: db.events,
        registrations: db.registrations,
        attendance: db.attendance,
        attendanceSessions: db.attendanceSessions,
        certificates: db.certificates,
        notifications: db.notifications,
        feedback: db.feedback,
        auditLogs: db.auditLogs,
        updatedAt: db.updatedAt,
      },
      error: null,
    },
    { status: 200, headers: CORS_HEADERS }
  );
}

/**
 * POST /api/v1/auth
 * Unified PARISAR Authentication & State Synchronization API for Web & Android
 * Uses bcryptjs password hashing, signed JWT tokens, HttpOnly cookies, and MongoDB/persistent storage.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'login';
    const db = await loadSharedDbAsync();

    // 1. LOGIN (Web & Android)
    if (action === 'login') {
      const rawIdentifier = (body.identifier || body.email || body.rollNumber || '').trim();
      const cleanId = rawIdentifier.toLowerCase();
      const password = body.password ? String(body.password) : undefined;
      const adminOnly = Boolean(body.adminOnly);

      if (!cleanId) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'EMPTY_IDENTIFIER',
              message: 'Account not found. Check your email or roll number.',
            },
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const found = db.users.find(
        u =>
          u.email.toLowerCase() === cleanId ||
          (u.rollNumber && u.rollNumber.toLowerCase() === cleanId) ||
          u._id.toLowerCase() === cleanId
      );

      if (!found) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'ACCOUNT_NOT_FOUND',
              message: 'Account not found. Check your email or roll number.',
            },
          },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      // Verify password using bcryptjs if password was provided and account has passwordHash
      if (found.passwordHash && password !== undefined && password.length > 0) {
        const isValid = verifyPassword(password, found.passwordHash);
        // Also allow demo login for pre-seeded accounts if user uses default demo password or exact seed password
        const isSeedDemoMatch =
          found.rollNumber?.toUpperCase() === 'Y25170504' && password === 'Programmer@01';
        if (!isValid && !isSeedDemoMatch) {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'INCORRECT_PASSWORD',
                message: 'Incorrect password.',
              },
            },
            { status: 401, headers: CORS_HEADERS }
          );
        }
      }

      if (adminOnly && found.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'UNAUTHORIZED_ADMIN',
              message: 'Restricted to University Administration accounts only.',
            },
          },
          { status: 403, headers: CORS_HEADERS }
        );
      }

      // Enforce 1 Web + 1 Mobile Device Verification Rule if deviceId & platform provided
      const deviceId = body.deviceId ? String(body.deviceId) : undefined;
      const platform: 'web' | 'mobile' = body.platform === 'mobile' ? 'mobile' : 'web';
      const deviceName = body.deviceName
        ? String(body.deviceName)
        : platform === 'mobile'
        ? 'PARISAR Android Client'
        : 'PARISAR Web Browser';
      const replaceExistingDevice = Boolean(body.replaceExistingDevice);
      const nowIso = new Date().toISOString();

      if (deviceId) {
        const currentDevices = Array.isArray(found.registeredDevices)
          ? [...found.registeredDevices]
          : [];
        const existingPlatformDevice = currentDevices.find(d => d.platform === platform);

        if (
          existingPlatformDevice &&
          existingPlatformDevice.deviceId !== deviceId &&
          !replaceExistingDevice
        ) {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'DEVICE_LIMIT_REACHED',
                message: `Another ${platform.toUpperCase()} device (${existingPlatformDevice.deviceName}) is already verified for this account. Confirm device replacement to bind this device.`,
              },
            },
            { status: 409, headers: CORS_HEADERS }
          );
        }

        const filteredDevices = currentDevices.filter(d => d.platform !== platform);
        filteredDevices.push({
          deviceId,
          platform,
          deviceName,
          verifiedAt:
            existingPlatformDevice?.deviceId === deviceId
              ? existingPlatformDevice.verifiedAt
              : nowIso,
          lastActiveAt: nowIso,
        });

        found.registeredDevices = filteredDevices;
        found.updatedAt = nowIso;
      }

      recordAuditLog({
        actor: found._id,
        actorName: found.name,
        role: found.role,
        action: 'LOGIN',
        entity: 'User',
        entityId: found._id,
        metadata: { platform, deviceId },
      });

      await persistSharedDb();

      const token = createAuthToken(found);
      const response = NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: sanitizeUser(found),
            users: db.users.map(sanitizeUser),
            organizerRequests: db.organizerRequests,
            venues: db.venues,
            events: db.events,
            registrations: db.registrations,
            attendance: db.attendance,
            certificates: db.certificates,
            notifications: db.notifications,
            auditLogs: db.auditLogs,
          },
          error: null,
        },
        { status: 200, headers: CORS_HEADERS }
      );

      response.cookies.set('parisar_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2. REGISTER STUDENT ACCOUNT (Shared across Web & Android)
    if (action === 'register-student') {
      const name = (body.name || '').trim();
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const cleanRoll = (body.rollNumber || '').trim().toUpperCase();
      const department =
        body.department || 'Department of Computer Science & Applications (DCSA)';
      const semester = Number(body.semester) || 6;
      const password = body.password ? String(body.password) : undefined;
      const hashedPassword = password ? hashPassword(password) : undefined;

      if (!name || !cleanEmail || !cleanRoll) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Full Name, Roll Number, and University Email are mandatory.',
            },
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const existingIndex = db.users.findIndex(
        u =>
          u.email.toLowerCase() === cleanEmail ||
          (u.rollNumber && u.rollNumber.toUpperCase() === cleanRoll)
      );

      const nowIso = new Date().toISOString();

      if (existingIndex !== -1) {
        const updatedExisting: User = {
          ...db.users[existingIndex],
          name,
          email: cleanEmail,
          rollNumber: cleanRoll,
          department,
          semester,
          passwordHash: hashedPassword || db.users[existingIndex].passwordHash,
          updatedAt: nowIso,
        };
        db.users[existingIndex] = updatedExisting;
        await persistSharedDb();

        const token = createAuthToken(updatedExisting);
        const response = NextResponse.json(
          {
            success: true,
            data: {
              token,
              user: sanitizeUser(updatedExisting),
              users: db.users.map(sanitizeUser),
            },
            error: null,
          },
          { status: 200, headers: CORS_HEADERS }
        );
        response.cookies.set('parisar_token', token, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }

      const newUser: User = {
        _id: body._id || `stu-${Date.now()}`,
        name,
        email: cleanEmail,
        rollNumber: cleanRoll,
        department,
        semester,
        role: 'student',
        passwordHash: hashedPassword,
        organizerStatus: 'NONE',
        interests: ['Workshop', 'Seminar', 'Cultural', 'Competition'],
        profileImage: '',
        phone: '+91 98260 00000',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.users.unshift(newUser);
      recordAuditLog({
        actor: newUser._id,
        actorName: newUser.name,
        role: 'student',
        action: 'STUDENT_REGISTERED',
        entity: 'User',
        entityId: newUser._id,
        metadata: { rollNumber: cleanRoll, department },
      });
      await persistSharedDb();

      const token = createAuthToken(newUser);
      const response = NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: sanitizeUser(newUser),
            users: db.users.map(sanitizeUser),
          },
          error: null,
        },
        { status: 201, headers: CORS_HEADERS }
      );
      response.cookies.set('parisar_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // 3. REGISTER ORGANIZER ACCOUNT (role = organizer, organizerStatus = PENDING)
    if (action === 'register-organizer') {
      const name = (body.name || '').trim();
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const cleanId = (body.universityId || body.rollNumber || '').trim().toUpperCase();
      const department =
        body.department || 'Department of Computer Science & Applications (DCSA)';
      const designation = (body.designation || 'Faculty / Society Event Convener').trim();
      const phone = (body.phone || '+91 98260 00000').trim();
      const reason = (body.reason || '').trim();
      const password = body.password ? String(body.password) : undefined;
      const hashedPassword = password ? hashPassword(password) : undefined;

      if (!name || !cleanEmail || !cleanId || !reason) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Full Name, University ID, Email, and Justification are mandatory.',
            },
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const nowIso = new Date().toISOString();
      const userId = body._id || `org-applicant-${Date.now()}`;
      const reqId = `req-${Date.now()}`;

      const newReq: OrganizerVerificationRequest = {
        id: reqId,
        userId,
        fullName: name,
        universityId: cleanId,
        department,
        designation,
        email: cleanEmail,
        phone,
        reason,
        status: 'PENDING',
        submittedAt: nowIso,
      };

      const existingIndex = db.users.findIndex(
        u =>
          u.email.toLowerCase() === cleanEmail ||
          (u.rollNumber && u.rollNumber.toUpperCase() === cleanId)
      );

      let savedUser: User;
      if (existingIndex !== -1) {
        savedUser = {
          ...db.users[existingIndex],
          name,
          email: cleanEmail,
          rollNumber: cleanId,
          department,
          designation,
          organization: department,
          role: 'organizer',
          organizerStatus: 'PENDING',
          organizerRequest: newReq,
          passwordHash: hashedPassword || db.users[existingIndex].passwordHash,
          phone,
          updatedAt: nowIso,
        };
        db.users[existingIndex] = savedUser;
      } else {
        savedUser = {
          _id: userId,
          name,
          email: cleanEmail,
          rollNumber: cleanId,
          department,
          designation,
          organization: department,
          role: 'organizer',
          organizerStatus: 'PENDING',
          organizerRequest: newReq,
          passwordHash: hashedPassword,
          interests: ['Seminar', 'Workshop', 'Competition'],
          profileImage: '',
          phone,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.users.unshift(savedUser);
      }

      db.organizerRequests.unshift(newReq);
      recordAuditLog({
        actor: savedUser._id,
        actorName: savedUser.name,
        role: 'organizer',
        action: 'ORGANIZER_REQUEST',
        entity: 'OrganizerVerificationRequest',
        entityId: newReq.id,
        metadata: { universityId: cleanId, department, designation },
      });
      await persistSharedDb();

      const token = createAuthToken(savedUser);
      const response = NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: sanitizeUser(savedUser),
            request: newReq,
            users: db.users.map(sanitizeUser),
            organizerRequests: db.organizerRequests,
          },
          error: null,
        },
        { status: 201, headers: CORS_HEADERS }
      );
      response.cookies.set('parisar_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // 4. SYNC ACCOUNTS & DOMAIN STATE FROM CLIENT TO SHARED SERVER DATABASE
    if (action === 'sync-state') {
      const incomingUsers: User[] = Array.isArray(body.users) ? body.users : [];
      const incomingReqs: OrganizerVerificationRequest[] = Array.isArray(body.organizerRequests)
        ? body.organizerRequests
        : [];
      const incomingEvents = Array.isArray(body.events) ? body.events : null;
      const incomingRegistrations = Array.isArray(body.registrations) ? body.registrations : null;
      const incomingAttendance = Array.isArray(body.attendance) ? body.attendance : null;
      const incomingCertificates = Array.isArray(body.certificates) ? body.certificates : null;
      const incomingNotifications = Array.isArray(body.notifications) ? body.notifications : null;
      const incomingVenues = Array.isArray(body.venues) ? body.venues : null;

      for (const u of incomingUsers) {
        if (!u || !u.email) continue;
        // Never allow public sync to escalate a non-admin user to admin unless already admin on server
        const idx = db.users.findIndex(
          existing =>
            existing._id === u._id ||
            existing.email.toLowerCase() === u.email.toLowerCase() ||
            (u.rollNumber &&
              existing.rollNumber &&
              existing.rollNumber.toUpperCase() === u.rollNumber.toUpperCase())
        );
        if (idx === -1) {
          const safeRole = u.role === 'admin' ? 'student' : u.role;
          db.users.unshift({
            ...u,
            role: safeRole,
            passwordHash: u.passwordHash ? hashPassword(u.passwordHash) : undefined,
          });
        } else {
          db.users[idx] = {
            ...db.users[idx],
            ...u,
            role: db.users[idx].role === 'admin' ? 'admin' : u.role === 'admin' ? db.users[idx].role : u.role,
            passwordHash: u.passwordHash
              ? hashPassword(u.passwordHash)
              : db.users[idx].passwordHash,
            registeredDevices: u.registeredDevices || db.users[idx].registeredDevices,
          };
        }
      }

      for (const r of incomingReqs) {
        if (!r || !r.id) continue;
        const rIdx = db.organizerRequests.findIndex(existing => existing.id === r.id);
        if (rIdx === -1) {
          db.organizerRequests.unshift(r);
        } else {
          db.organizerRequests[rIdx] = { ...db.organizerRequests[rIdx], ...r };
        }
      }

      if (incomingVenues) {
        for (const v of incomingVenues) {
          if (!v || !v.id) continue;
          const vIdx = db.venues.findIndex(existing => existing.id === v.id);
          if (vIdx === -1) {
            db.venues.push(v);
          } else {
            db.venues[vIdx] = { ...db.venues[vIdx], ...v };
          }
        }
      }

      if (incomingEvents) {
        for (const ev of incomingEvents) {
          if (!ev || !ev._id) continue;
          const eIdx = db.events.findIndex(existing => existing._id === ev._id);
          if (eIdx === -1) {
            db.events.unshift(ev);
          } else {
            db.events[eIdx] = { ...db.events[eIdx], ...ev };
          }
        }
      }

      if (incomingRegistrations) {
        for (const reg of incomingRegistrations) {
          if (!reg || !reg._id) continue;
          const regIdx = db.registrations.findIndex(existing => existing._id === reg._id);
          if (regIdx === -1) {
            db.registrations.unshift(reg);
          } else {
            db.registrations[regIdx] = { ...db.registrations[regIdx], ...reg };
          }
        }
      }

      if (incomingAttendance) {
        for (const att of incomingAttendance) {
          if (!att || !att._id) continue;
          const attIdx = db.attendance.findIndex(existing => existing._id === att._id);
          if (attIdx === -1) {
            db.attendance.unshift(att);
          } else {
            db.attendance[attIdx] = { ...db.attendance[attIdx], ...att };
          }
        }
      }

      if (incomingCertificates) {
        for (const cert of incomingCertificates) {
          if (!cert || !cert._id) continue;
          const cIdx = db.certificates.findIndex(existing => existing._id === cert._id);
          if (cIdx === -1) {
            db.certificates.unshift(cert);
          } else {
            db.certificates[cIdx] = { ...db.certificates[cIdx], ...cert };
          }
        }
      }

      if (incomingNotifications) {
        for (const notif of incomingNotifications) {
          if (!notif || !notif._id) continue;
          const nIdx = db.notifications.findIndex(existing => existing._id === notif._id);
          if (nIdx === -1) {
            db.notifications.unshift(notif);
          } else {
            db.notifications[nIdx] = { ...db.notifications[nIdx], ...notif };
          }
        }
      }

      await persistSharedDb();

      return NextResponse.json(
        {
          success: true,
          data: {
            users: db.users.map(sanitizeUser),
            organizerRequests: db.organizerRequests,
            venues: db.venues,
            events: db.events,
            registrations: db.registrations,
            attendance: db.attendance,
            certificates: db.certificates,
            notifications: db.notifications,
            auditLogs: db.auditLogs,
            updatedAt: db.updatedAt,
          },
          error: null,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 5. ADMIN REVIEW ORGANIZER REQUEST
    if (action === 'review-organizer') {
      const { requestId, approve, remarks } = body;
      const reqItem = db.organizerRequests.find(r => r.id === requestId);
      if (!reqItem) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: { code: 'NOT_FOUND', message: 'Verification request not found.' },
          },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const nowIso = new Date().toISOString();
      reqItem.status = approve ? 'APPROVED' : 'REJECTED';
      reqItem.reviewedAt = nowIso;
      reqItem.reviewRemarks =
        remarks ||
        (approve
          ? 'Approved by Office of the Dean of Students Welfare (DSW)'
          : 'Rejected by Administration');

      db.users = db.users.map(u => {
        if (
          u._id === reqItem.userId ||
          u.email.toLowerCase() === reqItem.email.toLowerCase() ||
          (u.rollNumber && u.rollNumber.toUpperCase() === reqItem.universityId.toUpperCase())
        ) {
          return {
            ...u,
            role: 'organizer',
            organizerStatus: approve ? 'VERIFIED' : 'REJECTED',
            updatedAt: nowIso,
          };
        }
        return u;
      });

      recordAuditLog({
        actor: 'admin-1',
        actorName: 'University Administrator (DSW)',
        role: 'admin',
        action: approve ? 'ORGANIZER_APPROVED' : 'ORGANIZER_REJECTED',
        entity: 'OrganizerVerificationRequest',
        entityId: reqItem.id,
        metadata: { applicant: reqItem.fullName, remarks: reqItem.reviewRemarks },
      });

      await persistSharedDb();

      return NextResponse.json(
        {
          success: true,
          data: {
            request: reqItem,
            users: db.users.map(sanitizeUser),
            organizerRequests: db.organizerRequests,
          },
          error: null,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 6. LOGOUT
    if (action === 'logout') {
      const response = NextResponse.json(
        { success: true, data: { loggedOut: true }, error: null },
        { status: 200, headers: CORS_HEADERS }
      );
      response.cookies.delete('parisar_token');
      return response;
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'UNKNOWN_ACTION', message: 'Unsupported auth action.' },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err) {
    const dbFallback = getSharedDb();
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: err instanceof Error ? err.message : `Internal server error (${dbFallback.updatedAt})`,
        },
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
