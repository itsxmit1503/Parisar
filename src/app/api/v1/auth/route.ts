import { NextRequest, NextResponse } from 'next/server';
import { getSharedDb, createAuthToken } from '../../../../lib/serverStore';
import { User, OrganizerVerificationRequest } from '../../../../types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/auth
 * Returns the shared PARISAR database snapshot (users, organizerRequests, events, registrations, attendance, etc.)
 * so Web and Android always share the exact same single source of truth.
 */
export async function GET() {
  const db = getSharedDb();
  return NextResponse.json(
    {
      success: true,
      data: {
        users: db.users,
        organizerRequests: db.organizerRequests,
        events: db.events,
        registrations: db.registrations,
        attendance: db.attendance,
        certificates: db.certificates,
        notifications: db.notifications,
        feedback: db.feedback,
        updatedAt: db.updatedAt,
      },
    },
    { status: 200, headers: CORS_HEADERS }
  );
}

/**
 * POST /api/v1/auth
 * Unified PARISAR Authentication & State Synchronization API for Web & Android
 * Actions:
 * - 'login': Authenticate by Email or Roll Number + Password
 * - 'register-student': Create a Student account in the shared database
 * - 'register-organizer': Create an Organizer account (verificationStatus = PENDING) in the shared database
 * - 'sync-user': Ensure a user created on a client is persisted in the shared database
 * - 'review-organizer': Admin approves/rejects an organizer request in the shared database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'login';
    const db = getSharedDb();

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
            error: {
              code: 'ACCOUNT_NOT_FOUND',
              message: 'Account not found. Check your email or roll number.',
            },
          },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      // Verify password if account has passwordHash stored
      if (found.passwordHash && password !== undefined && found.passwordHash !== password) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INCORRECT_PASSWORD',
              message: 'Incorrect password.',
            },
          },
          { status: 401, headers: CORS_HEADERS }
        );
      }

      if (adminOnly && found.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED_ADMIN',
              message: 'Your account is currently unavailable.',
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

        if (existingPlatformDevice && existingPlatformDevice.deviceId !== deviceId && !replaceExistingDevice) {
          return NextResponse.json(
            {
              success: false,
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
          verifiedAt: existingPlatformDevice?.deviceId === deviceId ? existingPlatformDevice.verifiedAt : nowIso,
          lastActiveAt: nowIso,
        });

        found.registeredDevices = filteredDevices;
        found.updatedAt = nowIso;
        db.updatedAt = nowIso;
      }

      const token = createAuthToken(found);
      return NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: found,
            users: db.users,
            organizerRequests: db.organizerRequests,
            events: db.events,
            registrations: db.registrations,
            attendance: db.attendance,
            certificates: db.certificates,
            notifications: db.notifications,
          },
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 2. REGISTER STUDENT ACCOUNT (Shared across Web & Android)
    if (action === 'register-student') {
      const name = (body.name || '').trim();
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const cleanRoll = (body.rollNumber || '').trim().toUpperCase();
      const department = body.department || 'Department of Computer Science & Applications (DCSA)';
      const semester = Number(body.semester) || 6;
      const password = body.password ? String(body.password) : undefined;

      if (!name || !cleanEmail || !cleanRoll) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Full Name, Roll Number, and University Email are mandatory.',
            },
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // Check if an account already exists with same email or rollNumber
      const existingIndex = db.users.findIndex(
        u =>
          u.email.toLowerCase() === cleanEmail ||
          (u.rollNumber && u.rollNumber.toUpperCase() === cleanRoll)
      );

      const nowIso = new Date().toISOString();

      // If existing seed/user account matches, update its credentials so the user can log in seamlessly across Web & Android
      if (existingIndex !== -1) {
        const updatedExisting: User = {
          ...db.users[existingIndex],
          name,
          email: cleanEmail,
          rollNumber: cleanRoll,
          department,
          semester,
          passwordHash: password || db.users[existingIndex].passwordHash,
          updatedAt: nowIso,
        };
        db.users[existingIndex] = updatedExisting;
        db.updatedAt = nowIso;

        const token = createAuthToken(updatedExisting);
        return NextResponse.json(
          {
            success: true,
            data: {
              token,
              user: updatedExisting,
              users: db.users,
            },
          },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const newUser: User = {
        _id: body._id || `stu-${Date.now()}`,
        name,
        email: cleanEmail,
        rollNumber: cleanRoll,
        department,
        semester,
        role: 'student',
        passwordHash: password,
        organizerStatus: 'NONE',
        interests: ['Workshop', 'Seminar', 'Cultural', 'Competition'],
        profileImage:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        phone: '+91 98260 00000',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.users.unshift(newUser);
      db.updatedAt = nowIso;

      const token = createAuthToken(newUser);
      return NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: newUser,
            users: db.users,
          },
        },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    // 3. REGISTER ORGANIZER ACCOUNT (role = organizer, organizerStatus = PENDING)
    if (action === 'register-organizer') {
      const name = (body.name || '').trim();
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const cleanId = (body.universityId || body.rollNumber || '').trim().toUpperCase();
      const department = body.department || 'Department of Computer Science & Applications (DCSA)';
      const designation = (body.designation || 'Faculty / Society Event Convener').trim();
      const phone = (body.phone || '+91 98260 00000').trim();
      const reason = (body.reason || '').trim();
      const password = body.password ? String(body.password) : undefined;

      if (!name || !cleanEmail || !cleanId || !reason) {
        return NextResponse.json(
          {
            success: false,
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
          passwordHash: password || db.users[existingIndex].passwordHash,
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
          passwordHash: password,
          interests: ['Seminar', 'Workshop', 'Competition'],
          profileImage:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
          phone,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.users.unshift(savedUser);
      }

      db.organizerRequests.unshift(newReq);
      db.updatedAt = nowIso;

      const token = createAuthToken(savedUser);
      return NextResponse.json(
        {
          success: true,
          data: {
            token,
            user: savedUser,
            request: newReq,
            users: db.users,
            organizerRequests: db.organizerRequests,
          },
        },
        { status: 201, headers: CORS_HEADERS }
      );
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

      const nowIso = new Date().toISOString();

      for (const u of incomingUsers) {
        if (!u || !u.email) continue;
        const idx = db.users.findIndex(
          existing =>
            existing._id === u._id ||
            existing.email.toLowerCase() === u.email.toLowerCase() ||
            (u.rollNumber &&
              existing.rollNumber &&
              existing.rollNumber.toUpperCase() === u.rollNumber.toUpperCase())
        );
        if (idx === -1) {
          db.users.unshift(u);
        } else {
          db.users[idx] = {
            ...db.users[idx],
            ...u,
            passwordHash: u.passwordHash || db.users[idx].passwordHash,
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

      db.updatedAt = nowIso;

      return NextResponse.json(
        {
          success: true,
          data: {
            users: db.users,
            organizerRequests: db.organizerRequests,
            events: db.events,
            registrations: db.registrations,
            attendance: db.attendance,
            certificates: db.certificates,
            notifications: db.notifications,
            updatedAt: db.updatedAt,
          },
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

      db.updatedAt = nowIso;

      return NextResponse.json(
        {
          success: true,
          data: {
            request: reqItem,
            users: db.users,
            organizerRequests: db.organizerRequests,
          },
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: 'Unsupported auth action.' },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Internal server error',
        },
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
