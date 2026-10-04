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
  Certificate,
  CampusNotification,
  EventFeedback,
  OrganizerVerificationRequest,
  AuditLogEntry,
  AuditAction,
  UserRole,
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
import { signJWT, sanitizeUser, generateSignedQrToken } from './jwt';
import { connectDB, isMongoConfigured } from './mongodb';
import {
  UserModel,
  OrganizerRequestModel,
  VenueModel,
  EventModel,
  RegistrationModel,
  AttendanceModel,
  AttendanceSessionModel,
  CertificateModel,
  NotificationModel,
  FeedbackModel,
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
    return plain; // Already hashed
  }
  return bcrypt.hashSync(plain, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash (with legacy plaintext migration support).
 */
export function verifyPassword(plain: string, storedHash?: string): boolean {
  if (!storedHash) return true; // Demo accounts without password set allow passwordless demo login
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(plain, storedHash);
  }
  // Legacy fallback if seed wasn't hashed yet
  return storedHash === plain;
}

function createInitialStore(): ParisarSharedDatabase {
  const adminEmailEnv = (process.env.ADMIN_EMAIL || 'dsw@dhsgsu.edu.in').trim().toLowerCase();
  const adminPasswordEnv = process.env.ADMIN_PASSWORD || 'parisar2026';

  // Ensure any initial user passwords are bcrypt-hashed and random stock human avatars are removed
  const hashedUsers: User[] = INITIAL_USERS.map(u => {
    const isSeededAdmin = u.role === 'admin' || u._id === 'admin-1';
    const rawPass = isSeededAdmin
      ? adminPasswordEnv
      : u.passwordHash || 'parisar2026';
    const cleanImg =
      u.profileImage && u.profileImage.includes('images.unsplash.com')
        ? ''
        : u.profileImage || '';
    return {
      ...u,
      email: isSeededAdmin ? adminEmailEnv : u.email,
      profileImage: cleanImg,
      passwordHash: hashPassword(rawPass),
    };
  });

  const initialAuditLogs: AuditLogEntry[] = [
    {
      _id: 'audit-init-1',
      actor: 'admin-1',
      actorName: 'Prof. S.P. Gautam (DSW)',
      role: 'admin',
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
      action: 'EVENT_APPROVED',
      entity: 'CampusEvent',
      entityId: 'evt-1',
      timestamp: '2026-09-26T14:00:00Z',
      metadata: { status: 'PUBLISHED' },
    },
  ];

  // Try loading from local persistent snapshot file if available
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ParisarSharedDatabase>;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return {
          users: parsed.users.map(u => ({
            ...u,
            profileImage:
              u.profileImage && u.profileImage.includes('images.unsplash.com')
                ? ''
                : u.profileImage || '',
            passwordHash: u.passwordHash ? hashPassword(u.passwordHash) : undefined,
          })),
          organizerRequests: parsed.organizerRequests || [...INITIAL_ORGANIZER_REQUESTS],
          venues: parsed.venues || [...CAMPUS_VENUES],
          events: parsed.events || [...INITIAL_EVENTS],
          registrations: parsed.registrations || [...INITIAL_REGISTRATIONS],
          attendance: parsed.attendance || [...INITIAL_ATTENDANCE],
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
    users: hashedUsers,
    organizerRequests: [...INITIAL_ORGANIZER_REQUESTS],
    venues: [...CAMPUS_VENUES],
    events: [...INITIAL_EVENTS],
    registrations: [...INITIAL_REGISTRATIONS],
    attendance: [...INITIAL_ATTENDANCE],
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

  // 1. Save local disk snapshot where writable
  try {
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in some serverless environments is expected
  }

  // 2. Sync to MongoDB Atlas if configured
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
        ...db.certificates.map(cert =>
          CertificateModel.findOneAndUpdate({ _id: cert._id }, cert, { upsert: true, new: true })
        ),
        ...db.auditLogs.slice(0, 100).map(log =>
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
      AttendanceSessionModel.find({}).lean(),
      CertificateModel.find({}).lean(),
      NotificationModel.find({}).lean(),
      AuditLogModel.find({}).sort({ timestamp: -1 }).limit(250).lean(),
    ]);

    if (mongoUsers.length === 0) {
      // Seed MongoDB on first connect
      await persistSharedDb();
      return db;
    }

    db.users = mongoUsers as unknown as User[];
    if (mongoReqs.length > 0) db.organizerRequests = mongoReqs as unknown as OrganizerVerificationRequest[];
    if (mongoVenues.length > 0) db.venues = mongoVenues as unknown as CampusVenue[];
    if (mongoEvents.length > 0) db.events = mongoEvents as unknown as CampusEvent[];
    if (mongoRegs.length > 0) db.registrations = mongoRegs as unknown as Registration[];
    if (mongoAtt.length > 0) db.attendance = mongoAtt as unknown as AttendanceRecord[];
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
 */
export function recordAuditLog(params: {
  actor: string;
  actorName?: string;
  role: UserRole;
  action: AuditAction;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): AuditLogEntry {
  const db = getSharedDb();
  const entry: AuditLogEntry = {
    _id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: params.actor,
    actorName: params.actorName,
    role: params.role,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    timestamp: new Date().toISOString(),
    metadata: params.metadata,
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

export { sanitizeUser, generateSignedQrToken };
