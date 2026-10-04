import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  sanitizeUser,
  hashPassword,
  hashSecretToken,
  generateSecureRandomToken,
  isLastActiveSuperAdmin,
} from '../../../../lib/serverStore';
import {
  ok,
  err,
  CORS_HEADERS,
  requireAdmin,
  requireSuperAdmin,
} from '../../../../lib/apiMiddleware';
import {
  EventStatus,
  User,
  AdminLevel,
  AdminPermission,
  AdminAccountStatus,
  ALL_ADMIN_PERMISSIONS,
  UserRole,
} from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/admin
 * Returns real backend-driven University Administrator metrics, administrators list,
 * pending organizer requests, event moderation queue, and recent audit activity.
 */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  const db = await loadSharedDbAsync();
  const administrators = db.users.filter(u => u.role === 'admin').map(sanitizeUser);
  const metrics = {
    totalStudents: db.users.filter(u => u.role === 'student').length,
    verifiedOrganizers: db.users.filter(
      u => u.role === 'organizer' && u.organizerStatus === 'VERIFIED'
    ).length,
    pendingOrganizerRequests: db.organizerRequests.filter(r => r.status === 'PENDING').length,
    pendingEvents: db.events.filter(e => e.status === 'PENDING_REVIEW').length,
    publishedEvents: db.events.filter(
      e => e.status === 'PUBLISHED' || e.status === 'APPROVED'
    ).length,
    activeOrUpcomingEvents: db.events.filter(
      e => e.status === 'PUBLISHED' || e.status === 'APPROVED' || e.status === 'ONGOING'
    ).length,
    completedEvents: db.events.filter(e => e.status === 'COMPLETED').length,
    totalRegistrations: db.registrations.filter(r => r.status === 'CONFIRMED').length,
    totalAttendance: db.attendance.filter(a => a.status === 'PRESENT').length,
    totalCertificates: db.certificates.length,
    totalVenues: db.venues.length,
    totalAdministrators: administrators.length,
  };

  return ok({
    metrics,
    administrators,
    organizerRequests: db.organizerRequests,
    events: db.events,
    users: db.users.map(sanitizeUser),
    auditLogs: db.auditLogs.slice(0, 150),
  });
}

/**
 * POST /api/v1/admin
 * Server-side permission-protected administrative operations:
 * - 'create-admin' | 'invite-admin' (SUPER_ADMIN only)
 * - 'update-admin-status' (SUPER_ADMIN only; protects final active SUPER_ADMIN)
 * - 'update-admin-permissions' (SUPER_ADMIN only; protects final active SUPER_ADMIN)
 * - 'moderate-event' (requires MANAGE_EVENTS)
 * - 'review-organizer' (requires MANAGE_ORGANIZERS)
 * - 'update-user-role' (requires MANAGE_USERS)
 */
export async function POST(req: NextRequest) {
  try {
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const action = body.action;
    const nowIso = new Date().toISOString();

    // 1. CREATE OR INVITE NEW UNIVERSITY ADMINISTRATOR (SUPER_ADMIN ONLY — Sections 6 & 7)
    if (action === 'create-admin' || action === 'invite-admin') {
      const superCheck = requireSuperAdmin(req);
      if (!superCheck.authorized) return superCheck.response;

      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const adminId = (body.adminId || body.employeeId || '').trim().toUpperCase();
      const department = (body.department || "Office of the Dean of Students' Welfare (DSW)").trim();
      const designation = (body.designation || 'University Administrative Officer').trim();
      const adminLevel: AdminLevel = body.adminLevel === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
      const requestedPermissions: AdminPermission[] = Array.isArray(body.permissions)
        ? body.permissions.filter((p: string) =>
            ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)
          )
        : ['MANAGE_ORGANIZERS', 'MANAGE_EVENTS', 'MANAGE_ATTENDANCE', 'VIEW_AUDIT_LOG'];

      if (!name || !email || !adminId) {
        return err(
          'VALIDATION_ERROR',
          'Administrator Name, University Email, and Admin/Employee ID are required.',
          400
        );
      }

      const duplicate = db.users.find(
        u =>
          u.email.toLowerCase() === email ||
          (u.adminId && u.adminId.toUpperCase() === adminId) ||
          (u.rollNumber && u.rollNumber.toUpperCase() === adminId)
      );

      if (duplicate) {
        return err(
          'DUPLICATE_ADMIN',
          'An account with this University Email or Admin ID already exists.',
          409
        );
      }

      const isInvite = action === 'invite-admin' || body.mode === 'invite' || !body.password;
      const rawInvitationToken = isInvite ? generateSecureRandomToken(20) : null;
      const invitationTokenHash = rawInvitationToken ? hashSecretToken(rawInvitationToken) : null;
      const invitationExpiresAt = rawInvitationToken
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        : null;

      const newAdmin: User = {
        _id: `admin-${Date.now()}`,
        name,
        email,
        adminId,
        rollNumber: adminId,
        department,
        designation,
        organization: 'Dr. Harisingh Gour Vishwavidyalaya, Sagar',
        role: 'admin',
        adminLevel,
        permissions:
          adminLevel === 'SUPER_ADMIN' ? [...ALL_ADMIN_PERMISSIONS] : requestedPermissions,
        status: isInvite ? 'INVITED' : 'ACTIVE',
        emailVerified: !isInvite,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdBy: superCheck.user.sub,
        invitationTokenHash,
        invitationExpiresAt,
        passwordHash: body.password ? hashPassword(String(body.password)) : undefined,
        interests: ['Academic', 'Seminar'],
        profileImage: '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.users.unshift(newAdmin);

      recordAuditLog({
        actor: superCheck.user.sub,
        actorName: superCheck.user.email,
        role: 'admin',
        adminLevel: 'SUPER_ADMIN',
        action: isInvite ? 'ADMIN_INVITED' : 'ADMIN_CREATED',
        entity: 'User',
        entityId: newAdmin._id,
        metadata: {
          name: newAdmin.name,
          email: newAdmin.email,
          adminId: newAdmin.adminId,
          adminLevel: newAdmin.adminLevel,
          permissions: newAdmin.permissions,
          status: newAdmin.status,
        },
      });

      await persistSharedDb();

      const smtpConfigured = Boolean(process.env.SMTP_HOST);
      return ok(
        {
          administrator: sanitizeUser(newAdmin),
          administrators: db.users.filter(u => u.role === 'admin').map(sanitizeUser),
          invitation: isInvite
            ? {
                emailDeliveryConfigured: smtpConfigured,
                deliveryNote: smtpConfigured
                  ? 'Invitation dispatched via configured university SMTP server.'
                  : 'Development Mode (No external SMTP provider configured): Share this one-time activation token securely with the invited administrator.',
                oneTimeActivationToken: rawInvitationToken,
                expiresAt: invitationExpiresAt,
                activationUrl: `/admin/login?invite=${rawInvitationToken}&email=${encodeURIComponent(email)}`,
              }
            : null,
        },
        201
      );
    }

    // 2. UPDATE ADMINISTRATOR STATUS: SUSPEND / REVOKE / ACTIVATE (SUPER_ADMIN ONLY — Sections 6 & 24)
    if (action === 'update-admin-status') {
      const superCheck = requireSuperAdmin(req);
      if (!superCheck.authorized) return superCheck.response;

      const targetAdminId = (body.adminUserId || body.userId || '').trim();
      const newStatus: AdminAccountStatus = body.status;

      if (!['ACTIVE', 'SUSPENDED', 'REVOKED', 'INVITED'].includes(newStatus)) {
        return err('INVALID_STATUS', 'Invalid administrator account status.', 400);
      }

      const targetIdx = db.users.findIndex(u => u._id === targetAdminId && u.role === 'admin');
      if (targetIdx === -1) {
        return err('ADMIN_NOT_FOUND', 'Administrator account not found.', 404);
      }

      // Section 24: Protect the Final Active SUPER_ADMIN
      if (
        newStatus !== 'ACTIVE' &&
        isLastActiveSuperAdmin(db, targetAdminId)
      ) {
        return err(
          'FINAL_SUPER_ADMIN_PROTECTED',
          'Operation blocked: The final active SUPER_ADMIN account cannot be suspended, revoked, or removed because doing so would leave PARISAR without an active Super Administrator.',
          400
        );
      }

      db.users[targetIdx] = {
        ...db.users[targetIdx],
        status: newStatus,
        lockedUntil: newStatus === 'ACTIVE' ? null : db.users[targetIdx].lockedUntil,
        failedLoginAttempts: newStatus === 'ACTIVE' ? 0 : db.users[targetIdx].failedLoginAttempts,
        updatedAt: nowIso,
      };

      const auditAction =
        newStatus === 'SUSPENDED'
          ? 'ADMIN_SUSPENDED'
          : newStatus === 'REVOKED'
          ? 'ADMIN_REVOKED'
          : 'ADMIN_ACTIVATED';

      recordAuditLog({
        actor: superCheck.user.sub,
        actorName: superCheck.user.email,
        role: 'admin',
        adminLevel: 'SUPER_ADMIN',
        action: auditAction,
        entity: 'User',
        entityId: targetAdminId,
        metadata: {
          targetAdminEmail: db.users[targetIdx].email,
          newStatus,
        },
      });

      await persistSharedDb();
      return ok({
        administrator: sanitizeUser(db.users[targetIdx]),
        administrators: db.users.filter(u => u.role === 'admin').map(sanitizeUser),
      });
    }

    // 3. UPDATE ADMINISTRATOR LEVEL & PERMISSIONS (SUPER_ADMIN ONLY — Sections 9 & 24)
    if (action === 'update-admin-permissions') {
      const superCheck = requireSuperAdmin(req);
      if (!superCheck.authorized) return superCheck.response;

      const targetAdminId = (body.adminUserId || body.userId || '').trim();
      const newLevel: AdminLevel =
        body.adminLevel === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
      const newPermissions: AdminPermission[] = Array.isArray(body.permissions)
        ? body.permissions.filter((p: string) =>
            ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission)
          )
        : [];

      const targetIdx = db.users.findIndex(u => u._id === targetAdminId && u.role === 'admin');
      if (targetIdx === -1) {
        return err('ADMIN_NOT_FOUND', 'Administrator account not found.', 404);
      }

      // Section 24: Protect the Final Active SUPER_ADMIN from demotion
      if (
        db.users[targetIdx].adminLevel === 'SUPER_ADMIN' &&
        newLevel !== 'SUPER_ADMIN' &&
        isLastActiveSuperAdmin(db, targetAdminId)
      ) {
        return err(
          'FINAL_SUPER_ADMIN_PROTECTED',
          'Operation blocked: The final active SUPER_ADMIN account cannot be demoted to normal ADMIN.',
          400
        );
      }

      const prevLevel = db.users[targetIdx].adminLevel;
      db.users[targetIdx] = {
        ...db.users[targetIdx],
        adminLevel: newLevel,
        permissions: newLevel === 'SUPER_ADMIN' ? [...ALL_ADMIN_PERMISSIONS] : newPermissions,
        updatedAt: nowIso,
      };

      recordAuditLog({
        actor: superCheck.user.sub,
        actorName: superCheck.user.email,
        role: 'admin',
        adminLevel: 'SUPER_ADMIN',
        action: prevLevel !== newLevel ? 'ADMIN_ROLE_CHANGED' : 'ADMIN_PERMISSION_CHANGED',
        entity: 'User',
        entityId: targetAdminId,
        metadata: {
          targetAdminEmail: db.users[targetIdx].email,
          adminLevel: newLevel,
          permissions: db.users[targetIdx].permissions,
        },
      });

      await persistSharedDb();
      return ok({
        administrator: sanitizeUser(db.users[targetIdx]),
        administrators: db.users.filter(u => u.role === 'admin').map(sanitizeUser),
      });
    }

    // 4. MODERATE EVENT PROPOSAL (Requires MANAGE_EVENTS permission)
    if (action === 'moderate-event') {
      const auth = requireAdmin(req, 'MANAGE_EVENTS');
      if (!auth.authorized) return auth.response;

      const eventId = body.eventId;
      const newStatus: EventStatus = body.status || body.newStatus;
      const rejectionReason = body.rejectionReason;

      const evIdx = db.events.findIndex(e => e._id === eventId);
      if (evIdx === -1) {
        return err('EVENT_NOT_FOUND', 'Event not found.', 404);
      }

      db.events[evIdx] = {
        ...db.events[evIdx],
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined,
        updatedAt: nowIso,
      };

      recordAuditLog({
        actor: auth.user.sub,
        actorName: auth.user.email,
        role: 'admin',
        adminLevel: auth.user.adminLevel,
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

    // 5. UPDATE USER ROLE (Requires MANAGE_USERS; assigning/removing 'admin' requires SUPER_ADMIN)
    if (action === 'update-user-role' || action === 'update-role') {
      const auth = requireAdmin(req, 'MANAGE_USERS');
      if (!auth.authorized) return auth.response;

      const targetUserId = (body.userId || '').trim();
      const newRole: UserRole = body.newRole || body.role;

      if (!['student', 'organizer', 'admin'].includes(newRole)) {
        return err('INVALID_ROLE', 'Invalid user role.', 400);
      }

      const uIdx = db.users.findIndex(u => u._id === targetUserId);
      if (uIdx === -1) {
        return err('USER_NOT_FOUND', 'User not found.', 404);
      }

      if (
        (newRole === 'admin' || db.users[uIdx].role === 'admin') &&
        auth.user.adminLevel !== 'SUPER_ADMIN'
      ) {
        return err(
          'SUPER_ADMIN_REQUIRED',
          'Only a Super Administrator can grant or remove University Administrator privileges.',
          403
        );
      }

      if (
        db.users[uIdx].role === 'admin' &&
        newRole !== 'admin' &&
        isLastActiveSuperAdmin(db, targetUserId)
      ) {
        return err(
          'FINAL_SUPER_ADMIN_PROTECTED',
          'Operation blocked: Cannot demote the final active Super Administrator.',
          400
        );
      }

      const previousRole = db.users[uIdx].role;
      db.users[uIdx] = {
        ...db.users[uIdx],
        role: newRole,
        adminLevel: newRole === 'admin' ? db.users[uIdx].adminLevel || 'ADMIN' : undefined,
        permissions:
          newRole === 'admin'
            ? db.users[uIdx].permissions || ['MANAGE_ORGANIZERS', 'MANAGE_EVENTS']
            : undefined,
        organizerStatus:
          newRole === 'organizer'
            ? 'VERIFIED'
            : newRole === 'student'
            ? 'NONE'
            : db.users[uIdx].organizerStatus,
        updatedAt: nowIso,
      };

      recordAuditLog({
        actor: auth.user.sub,
        actorName: auth.user.email,
        role: 'admin',
        adminLevel: auth.user.adminLevel,
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: targetUserId,
        metadata: {
          userName: db.users[uIdx].name,
          previousRole,
          newRole,
        },
      });

      await persistSharedDb();
      return ok({
        user: sanitizeUser(db.users[uIdx]),
        users: db.users.map(sanitizeUser),
      });
    }

    return err('UNKNOWN_ADMIN_ACTION', 'Unsupported administrative action.', 400);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Admin operation failed', 500);
  }
}
