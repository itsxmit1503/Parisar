import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  CampusEvent,
  CampusVenue,
  Registration,
  AttendanceRecord,
  AttendanceSession,
  TemporaryAttendanceToken,
  Certificate,
  CampusNotification,
  EventFeedback,
  OrganizerVerificationRequest,
  AuditLogEntry,
  AuditAction,
  UserRole,
  AdminLevel,
  AdminPermission,
  ALL_ADMIN_PERMISSIONS,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  CAMPUS_VENUES,
  INITIAL_REGISTRATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_CERTIFICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEEDBACK,
  INITIAL_ORGANIZER_REQUESTS,
} from './mockData';
import {
  signJWT,
  sanitizeUser,
  generateSignedQrToken,
  generateTemporaryAttendanceTokenString,
  hashSecretToken,
  generateSecureRandomToken,
} from './jwt';
import { connectDB, isMongoConfigured } from './mongodb';
import {
  UserModel,
  OrganizerRequestModel,
  VenueModel,
  EventModel,
  RegistrationModel,
  AttendanceModel,
  TempAttendanceTokenModel,
  AttendanceSessionModel,
  CertificateModel,
  NotificationModel,
  AuditLogModel,
} from '../models';

// ==============================================================================
// PARISAR Persistent Backend Database Store (MongoDB Atlas + File/Memory Cache)
// ==============================================================================

export interface ParisarSharedDatabase {
  users: User[];
  organizerRequests: OrganizerVerificationRequest[];
  venues: CampusVenue[];
  events: CampusEvent[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  tempQrTokens: TemporaryAttendanceToken[];
  attendanceSessions: AttendanceSession[];
  certificates: Certificate[];
  notifications: CampusNotification[];
  feedback: EventFeedback[];
  auditLogs: AuditLogEntry[];
  updatedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __PARISAR_SHARED_DB__: ParisarSharedDatabase | undefined;
}

const SNAPSHOT_FILE = path.join(process.cwd(), '.parisar_persistent_db.json');

/**
 * Hashes a plaintext password using bcryptjs (10 salt rounds).
 */
export function hashPassword(plain: string): string {
  if (!plain) return '';
  if (plain.startsWith('$2a$') || plain.startsWith('$2b$')) {
    return plain;
  }
  return bcrypt.hashSync(plain, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export function verifyPassword(plain: string, storedHash?: string): boolean {
  if (!storedHash || !plain) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(plain, storedHash);
  }
  return storedHash === plain;
}

/**
 * Idempotent bootstrap for the initial University Super Administrator (Section 4).
 * Uses environment variables when provided and ensures at least one active SUPER_ADMIN exists.
 * Stores only a bcrypt password hash; never exposes credentials to the frontend.
 */
export function bootstrapInitialSuperAdmin(users: User[]): User[] {
  const superAdminEmail = (
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'dsw@dhsgsu.edu.in'
  )
    .trim()
    .toLowerCase();
  const superAdminId = (process.env.SUPER_ADMIN_ID || 'ADMIN-DSW-001').trim();
  const bootstrapSecret =
    process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'parisar2026';

  const nowIso = new Date().toISOString();
  const updated: User[] = users.map((u): User => {
    const cleanImg =
      u.profileImage && u.profileImage.includes('images.unsplash.com') ? '' : u.profileImage || '';
    const isInitialSuper =
      u._id === 'admin-1' ||
      u.email.toLowerCase() === superAdminEmail ||
      (u.adminId && u.adminId.toLowerCase() === superAdminId.toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toLowerCase() === superAdminId.toLowerCase());

    if (isInitialSuper) {
      return {
        ...u,
        email: superAdminEmail,
        adminId: u.adminId || superAdminId,
        rollNumber: u.rollNumber || superAdminId,
        role: 'admin',
        adminLevel: 'SUPER_ADMIN',
        permissions: [...ALL_ADMIN_PERMISSIONS],
        adminPermissions: [...ALL_ADMIN_PERMISSIONS],
        status: u.status === 'SUSPENDED' || u.status === 'REVOKED' ? 'ACTIVE' : u.status || 'ACTIVE',
        adminAccountStatus:
          u.status === 'SUSPENDED' || u.status === 'REVOKED' ? 'ACTIVE' : u.status || 'ACTIVE',
        emailVerified: true,
        mfaEnabled: Boolean(u.mfaEnabled),
        failedLoginAttempts: u.failedLoginAttempts ?? 0,
        lockedUntil: u.lockedUntil ?? null,
        profileImage: cleanImg,
        passwordHash: u.passwordHash ? hashPassword(u.passwordHash) : hashPassword(bootstrapSecret),
      };
    }

    if (u.role === 'admin') {
      const resolvedPerms: AdminPermission[] =
        u.adminLevel === 'SUPER_ADMIN'
          ? [...ALL_ADMIN_PERMISSIONS]
          : u.permissions && u.permissions.length > 0
          ? u.permissions
          : ['MANAGE_ORGANIZERS', 'MANAGE_EVENTS', 'MANAGE_ATTENDANCE', 'VIEW_AUDIT_LOG'];
      return {
        ...u,
        adminLevel: u.adminLevel || 'ADMIN',
        permissions: resolvedPerms,
        adminPermissions: resolvedPerms,
        status: u.status || 'ACTIVE',
        adminAccountStatus: u.status || 'ACTIVE',
        emailVerified: u.emailVerified ?? true,
        failedLoginAttempts: u.failedLoginAttempts ?? 0,
        lockedUntil: u.lockedUntil ?? null,
        profileImage: cleanImg,
        passwordHash: u.passwordHash ? hashPassword(u.passwordHash) : hashPassword('parisar2026'),
      };
    }

    return {
      ...u,
      status: u.status || 'ACTIVE',
      profileImage: cleanImg,
      passwordHash: u.passwordHash ? hashPassword(u.passwordHash) : hashPassword('parisar2026'),
    };
  });

  const hasSuperAdmin = updated.some(
    u => u.role === 'admin' && u.adminLevel === 'SUPER_ADMIN' && u.status === 'ACTIVE'
  );

  if (!hasSuperAdmin) {
    updated.push({
      _id: 'admin-1',
      name: 'Prof. S.P. Gautam (DSW)',
      email: superAdminEmail,
      adminId: superAdminId,
      rollNumber: superAdminId,
      department: "Office of the Dean of Students' Welfare (DSW)",
      designation: "Dean of Students' Welfare & Chief Proctorial Authority",
      organization: 'Dr. Harisingh Gour Vishwavidyalaya, Sagar',
      role: 'admin',
      adminLevel: 'SUPER_ADMIN',
      permissions: [...ALL_ADMIN_PERMISSIONS],
      status: 'ACTIVE',
      emailVerified: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      interests: ['Academic', 'Cultural', 'Sports', 'Seminar'],
      profileImage: '',
      passwordHash: hashPassword(bootstrapSecret),
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return updated;
}

/**
 * Safety Rule (Section 24): Returns true if targetUserId is the final active SUPER_ADMIN.
 * Prevents deleting, revoking, demoting, or suspending the last active Super Admin.
 */
export function isLastActiveSuperAdmin(db: ParisarSharedDatabase, targetUserId: string): boolean {
  const activeSuperAdmins = db.users.filter(
    u => u.role === 'admin' && u.adminLevel === 'SUPER_ADMIN' && (u.status || 'ACTIVE') === 'ACTIVE'
  );
  return activeSuperAdmins.length <= 1 && activeSuperAdmins.some(u => u._id === targetUserId);
}

function createInitialStore(): ParisarSharedDatabase {
  const bootstrappedUsers = bootstrapInitialSuperAdmin(INITIAL_USERS);

  const normalizedAttendance: AttendanceRecord[] = INITIAL_ATTENDANCE.map(a => ({
    ...a,
    studentId: a.studentId || a.userId,
    attendanceType: a.method === 'online_session' ? 'ONLINE_SESSION' : 'OFFLINE_QR',
    status: a.status || 'PRESENT',
  }));

  const initialAuditLogs: AuditLogEntry[] = [
    {
      _id: 'audit-init-1',
      actor: 'admin-1',
      actorName: 'Prof. S.P. Gautam (DSW)',
      role: 'admin',
      adminLevel: 'SUPER_ADMIN',
      action: 'ORGANIZER_APPROVED',
      entity: 'OrganizerVerificationRequest',
      entityId: 'req-03',
      timestamp: '2026-09-25T11:00:00Z',
      metadata: { organizerName: 'Dr. Alok Sahay', department: 'DCSA' },
    },
    {
      _id: 'audit-init-2',
      actor: 'org-1',
      actorName: 'Dr. Alok Sahay',
      role: 'organizer',
      action: 'EVENT_CREATED',
      entity: 'CampusEvent',
      entityId: 'evt-1',
      timestamp: '2026-09-26T09:30:00Z',
      metadata: { title: 'National Workshop on Deep Learning & Neural Architectures' },
    },
    {
      _id: 'audit-init-3',
      actor: 'admin-1',
      actorName: 'Prof. S.P. Gautam (DSW)',
      role: 'admin',
      adminLevel: 'SUPER_ADMIN',
      action: 'EVENT_APPROVED',
      entity: 'CampusEvent',
      entityId: 'evt-1',
      timestamp: '2026-09-26T14:00:00Z',
      metadata: { status: 'PUBLISHED' },
    },
  ];

  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ParisarSharedDatabase>;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return {
          users: bootstrapInitialSuperAdmin(parsed.users),
          organizerRequests: parsed.organizerRequests || [...INITIAL_ORGANIZER_REQUESTS],
          venues: parsed.venues || [...CAMPUS_VENUES],
          events: parsed.events || [...INITIAL_EVENTS],
          registrations: parsed.registrations || [...INITIAL_REGISTRATIONS],
          attendance: (parsed.attendance || normalizedAttendance).map(a => ({
            ...a,
            studentId: a.studentId || a.userId,
            attendanceType:
              a.attendanceType || (a.method === 'online_session' ? 'ONLINE_SESSION' : 'OFFLINE_QR'),
            status: a.status || 'PRESENT',
          })),
          tempQrTokens: parsed.tempQrTokens || [],
          attendanceSessions: parsed.attendanceSessions || [],
          certificates: parsed.certificates || [...INITIAL_CERTIFICATES],
          notifications: parsed.notifications || [...INITIAL_NOTIFICATIONS],
          feedback: parsed.feedback || [...INITIAL_FEEDBACK],
          auditLogs: parsed.auditLogs || initialAuditLogs,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // Ignore file read errors in read-only serverless environments
  }

  return {
    users: bootstrappedUsers,
    organizerRequests: [...INITIAL_ORGANIZER_REQUESTS],
    venues: [...CAMPUS_VENUES],
    events: [...INITIAL_EVENTS],
    registrations: [...INITIAL_REGISTRATIONS],
    attendance: normalizedAttendance,
    tempQrTokens: [],
    attendanceSessions: [],
    certificates: [...INITIAL_CERTIFICATES],
    notifications: [...INITIAL_NOTIFICATIONS],
    feedback: [...INITIAL_FEEDBACK],
    auditLogs: initialAuditLogs,
    updatedAt: new Date().toISOString(),
  };
}

export function getSharedDb(): ParisarSharedDatabase {
  if (!globalThis.__PARISAR_SHARED_DB__) {
    globalThis.__PARISAR_SHARED_DB__ = createInitialStore();
  }
  return globalThis.__PARISAR_SHARED_DB__;
}

/**
 * Persists the current state to disk snapshot and (when MONGODB_URI is set) to MongoDB Atlas.
 */
export async function persistSharedDb(): Promise<void> {
  const db = getSharedDb();
  db.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in serverless environments is expected
  }

  if (isMongoConfigured()) {
    try {
      const conn = await connectDB();
      if (!conn) return;

      await Promise.all([
        ...db.users.map(u =>
          UserModel.findOneAndUpdate({ _id: u._id }, u, { upsert: true, new: true })
        ),
        ...db.organizerRequests.map(r =>
          OrganizerRequestModel.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true })
        ),
        ...db.venues.map(v =>
          VenueModel.findOneAndUpdate({ id: v.id }, v, { upsert: true, new: true })
        ),
        ...db.events.map(e =>
          EventModel.findOneAndUpdate({ _id: e._id }, e, { upsert: true, new: true })
        ),
        ...db.registrations.map(reg =>
          RegistrationModel.findOneAndUpdate({ _id: reg._id }, reg, { upsert: true, new: true })
        ),
        ...db.attendance.map(att =>
          AttendanceModel.findOneAndUpdate({ _id: att._id }, att, { upsert: true, new: true })
        ),
        ...db.tempQrTokens.slice(0, 200).map(t =>
          TempAttendanceTokenModel.findOneAndUpdate({ id: t.id }, t, { upsert: true, new: true })
        ),
        ...db.certificates.map(cert =>
          CertificateModel.findOneAndUpdate({ _id: cert._id }, cert, { upsert: true, new: true })
        ),
        ...db.auditLogs.slice(0, 150).map(log =>
          AuditLogModel.findOneAndUpdate({ _id: log._id }, log, { upsert: true, new: true })
        ),
      ]);
    } catch (err) {
      console.warn('[PARISAR DB] MongoDB persist warning:', err);
    }
  }
}

/**
 * Loads database from MongoDB Atlas if configured and populated, otherwise returns initialized store.
 */
export async function loadSharedDbAsync(): Promise<ParisarSharedDatabase> {
  const db = getSharedDb();
  if (!isMongoConfigured()) {
    return db;
  }

  try {
    const conn = await connectDB();
    if (!conn) return db;

    const [
      mongoUsers,
      mongoReqs,
      mongoVenues,
      mongoEvents,
      mongoRegs,
      mongoAtt,
      mongoTempTokens,
      mongoSessions,
      mongoCerts,
      mongoNotifs,
      mongoLogs,
    ] = await Promise.all([
      UserModel.find({}).lean(),
      OrganizerRequestModel.find({}).lean(),
      VenueModel.find({}).lean(),
      EventModel.find({}).lean(),
      RegistrationModel.find({}).lean(),
      AttendanceModel.find({}).lean(),
      TempAttendanceTokenModel.find({}).lean(),
      AttendanceSessionModel.find({}).lean(),
      CertificateModel.find({}).lean(),
      NotificationModel.find({}).lean(),
      AuditLogModel.find({}).sort({ timestamp: -1 }).limit(250).lean(),
    ]);

    if (mongoUsers.length === 0) {
      await persistSharedDb();
      return db;
    }

    db.users = bootstrapInitialSuperAdmin(mongoUsers as unknown as User[]);
    if (mongoReqs.length > 0) db.organizerRequests = mongoReqs as unknown as OrganizerVerificationRequest[];
    if (mongoVenues.length > 0) db.venues = mongoVenues as unknown as CampusVenue[];
    if (mongoEvents.length > 0) db.events = mongoEvents as unknown as CampusEvent[];
    if (mongoRegs.length > 0) db.registrations = mongoRegs as unknown as Registration[];
    if (mongoAtt.length > 0) db.attendance = mongoAtt as unknown as AttendanceRecord[];
    if (mongoTempTokens.length > 0) db.tempQrTokens = mongoTempTokens as unknown as TemporaryAttendanceToken[];
    if (mongoSessions.length > 0) db.attendanceSessions = mongoSessions as unknown as AttendanceSession[];
    if (mongoCerts.length > 0) db.certificates = mongoCerts as unknown as Certificate[];
    if (mongoNotifs.length > 0) db.notifications = mongoNotifs as unknown as CampusNotification[];
    if (mongoLogs.length > 0) db.auditLogs = mongoLogs as unknown as AuditLogEntry[];
  } catch (err) {
    console.warn('[PARISAR DB] MongoDB read fallback:', err);
  }

  return db;
}

/**
 * Appends an immutable entry to the persistent Audit Log.
 * Never stores raw passwords, tokens, or invitation secrets.
 */
export function recordAuditLog(params: {
  actor: string;
  actorName?: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): AuditLogEntry {
  const db = getSharedDb();
  const safeMetadata = params.metadata ? { ...params.metadata } : undefined;
  if (safeMetadata) {
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.token;
    delete safeMetadata.invitationToken;
    delete safeMetadata.invitationTokenHash;
  }

  const entry: AuditLogEntry = {
    _id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: params.actor,
    actorName: params.actorName,
    role: params.role,
    adminLevel: params.adminLevel,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    timestamp: new Date().toISOString(),
    metadata: safeMetadata,
  };
  db.auditLogs.unshift(entry);
  return entry;
}

/**
 * Signs a real JWT token for PARISAR Auth API
 */
export function createAuthToken(user: User): string {
  return signJWT(user);
}

export {
  sanitizeUser,
  generateSignedQrToken,
  generateTemporaryAttendanceTokenString,
  hashSecretToken,
  generateSecureRandomToken,
};
