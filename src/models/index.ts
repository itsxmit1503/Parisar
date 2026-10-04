import mongoose, { Schema, Model } from 'mongoose';
import {
  User,
  OrganizerVerificationRequest,
  CampusVenue,
  CampusEvent,
  Registration,
  AttendanceRecord,
  AttendanceSession,
  TemporaryAttendanceToken,
  Certificate,
  CampusNotification,
  EventFeedback,
  AuditLogEntry,
  RegisteredDevice,
} from '../types';

// 1. RegisteredDevice Subschema
const RegisteredDeviceSchema = new Schema<RegisteredDevice & { userId?: string }>(
  {
    deviceId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    platform: { type: String, enum: ['web', 'mobile'], required: true },
    deviceName: { type: String, required: true },
    verifiedAt: { type: String, required: true },
    lastActiveAt: { type: String, required: true },
  },
  { _id: false }
);

// 2. User & Administrator Schema
const UserSchema = new Schema<User>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    rollNumber: { type: String, index: true },
    adminId: { type: String, index: true },
    department: { type: String, required: true },
    semester: { type: Number },
    role: { type: String, enum: ['student', 'organizer', 'admin'], required: true, default: 'student' },
    adminLevel: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'] },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ['INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED'], default: 'ACTIVE' },
    emailVerified: { type: Boolean, default: true },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: String, default: null },
    lastPasswordChangeAt: { type: String },
    createdBy: { type: String },
    invitationTokenHash: { type: String, default: null },
    invitationExpiresAt: { type: String, default: null },
    resetTokenHash: { type: String, default: null },
    resetExpiresAt: { type: String, default: null },
    interests: { type: [String], default: [] },
    profileImage: { type: String, default: '' },
    bio: { type: String },
    preferredLanguage: { type: String, enum: ['en', 'hi'], default: 'en' },
    notificationPreferences: { type: Schema.Types.Mixed },
    privacyPreferences: { type: Schema.Types.Mixed },
    designation: { type: String },
    organization: { type: String },
    phone: { type: String },
    organizerStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NONE',
    },
    organizerRequest: { type: Schema.Types.Mixed },
    registeredDevices: { type: [RegisteredDeviceSchema], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

// 3. OrganizerVerificationRequest Schema
const OrganizerRequestSchema = new Schema<OrganizerVerificationRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    universityId: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    submittedAt: { type: String, required: true },
    reviewedAt: { type: String },
    reviewRemarks: { type: String },
  },
  { versionKey: false }
);

// 4. CampusVenue Schema
const CampusVenueSchema = new Schema<CampusVenue>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    secondaryName: { type: String },
    plusCode: { type: String },
    category: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    description: { type: String, required: true },
    address: { type: String, required: true },
    verified: { type: String, enum: ['verified', 'partially_verified', 'unverified'], default: 'verified' },
    source: { type: String, required: true },
    navigationQuery: { type: String, required: true },
    isEventVenue: { type: Boolean, default: true },
    building: { type: String },
    floor: { type: String },
    capacity: { type: Number, default: 100 },
    features: { type: [String], default: [] },
    directions: { type: String },
  },
  { versionKey: false }
);

// 5. CampusEvent Schema
const CampusEventSchema = new Schema<CampusEvent>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    eventMode: { type: String, enum: ['OFFLINE', 'ONLINE', 'HYBRID'], default: 'OFFLINE' },
    onlineLink: { type: String },
    organizerId: { type: String, required: true, index: true },
    organizerName: { type: String, required: true },
    organizerEmail: { type: String, required: true },
    venue: { type: String, required: true },
    venueId: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true },
    registrationCount: { type: Number, default: 0 },
    registrationDeadline: { type: String, required: true },
    tags: { type: [String], default: [] },
    coverImage: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_REVIEW',
      index: true,
    },
    eligibility: { type: String },
    specialInstructions: { type: String },
    departmentScope: { type: String },
    certificateRequired: { type: Boolean, default: true },
    minParticipationPercent: { type: Number, default: 80 },
    onlineAttendancePolicy: { type: Schema.Types.Mixed },
    attendanceSessionStatus: {
      type: String,
      enum: ['NOT_STARTED', 'OPEN', 'ACTIVE', 'FINALIZED', 'CLOSED'],
      default: 'NOT_STARTED',
    },
    attendanceStartedAt: { type: String },
    attendanceClosedAt: { type: String },
    attendanceFinalizedAt: { type: String },
    attendanceFinalizedBy: { type: String },
    rejectionReason: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

// 6. Registration Schema
const RegistrationSchema = new Schema<Registration>(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRollNumber: { type: String, required: true },
    userDepartment: { type: String, required: true },
    userEmail: { type: String, required: true },
    status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
    registeredAt: { type: String, required: true },
    qrToken: { type: String, required: true, unique: true, index: true },
    checkedInAt: { type: String, default: null },
  },
  { _id: false, versionKey: false }
);

// 7. AttendanceRecord Schema
const AttendanceRecordSchema = new Schema<AttendanceRecord>(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    registrationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    studentId: { type: String, index: true },
    userName: { type: String, required: true },
    userRollNumber: { type: String, required: true },
    userDepartment: { type: String, required: true },
    attendanceType: { type: String, enum: ['OFFLINE_QR', 'ONLINE_SESSION'], default: 'OFFLINE_QR' },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'IN_PROGRESS'], default: 'PRESENT' },
    checkedInAt: { type: String, required: true },
    checkedOutAt: { type: String },
    checkedInBy: { type: String, required: true },
    method: { type: String, enum: ['qr', 'online_session', 'admin_override', 'roster', 'manual'], default: 'qr' },
    checkpointsVerified: { type: Number, default: 0 },
    checkpointsRequired: { type: Number, default: 2 },
    checkpointsTotal: { type: Number, default: 3 },
    checkpoints: { type: Schema.Types.Mixed },
    participatedMinutes: { type: Number, default: 0 },
    requiredMinutes: { type: Number, default: 0 },
    totalEventMinutes: { type: Number, default: 60 },
    participationPercent: { type: Number, default: 0 },
    sessionStatus: {
      type: String,
      enum: ['JOINED', 'ACTIVE', 'PAUSED', 'PAUSED_DISCONNECTED', 'RESUMED', 'ENDED', 'COMPLETED'],
      default: 'ACTIVE',
    },
    lastValidatedAt: { type: String },
    eligibleForCertificate: { type: Boolean, default: false },
    finalizedAt: { type: String },
    finalizedBy: { type: String },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false, versionKey: false }
);

// 8. TemporaryAttendanceToken Schema (60-second Offline QR Tokens)
const TempAttendanceTokenSchema = new Schema<TemporaryAttendanceToken>(
  {
    id: { type: String, required: true, unique: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    registrationId: { type: String, required: true },
    createdAt: { type: String, required: true },
    expiresAt: { type: String, required: true },
    usedAt: { type: String, default: null },
  },
  { versionKey: false }
);

// 9. AttendanceSession Schema
const AttendanceSessionSchema = new Schema<AttendanceSession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    studentId: { type: String, index: true },
    registrationId: { type: String },
    organizerId: { type: String },
    joinedAt: { type: String },
    leftAt: { type: String },
    startedAt: { type: String },
    endedAt: { type: String },
    verifiedDuration: { type: Number, default: 0 },
    mode: { type: String, enum: ['OFFLINE', 'ONLINE', 'HYBRID'], default: 'OFFLINE' },
    minimumParticipationPercent: { type: Number, default: 80 },
    checkpoints: { type: Schema.Types.Mixed },
    checkpointsVerified: { type: Number, default: 0 },
    checkpointsRequired: { type: Number, default: 2 },
    checkpointsTotal: { type: Number, default: 3 },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'OPEN', 'ACTIVE', 'PAUSED', 'DISCONNECTED', 'RESUMED', 'ENDED', 'FINALIZED', 'CLOSED'],
      default: 'ACTIVE',
    },
  },
  { versionKey: false }
);

// 10. Certificate Schema
const CertificateSchema = new Schema<Certificate>(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    eventTitle: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRollNumber: { type: String, required: true },
    department: { type: String, required: true },
    certificateUrl: { type: String, required: true },
    verificationCode: { type: String, required: true, unique: true, index: true },
    issuedAt: { type: String, required: true },
    certificateType: { type: String, enum: ['PARTICIPATION', 'MERIT', 'EXCELLENCE'], default: 'PARTICIPATION' },
    issueAuthorizedBy: { type: String, required: true },
    academicAuthority: { type: String },
    participationPercent: { type: Number },
    participatedMinutes: { type: Number },
  },
  { _id: false, versionKey: false }
);

// 11. CampusNotification Schema
const NotificationSchema = new Schema<CampusNotification>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    eventId: { type: String },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

// 12. EventFeedback Schema
const FeedbackSchema = new Schema<EventFeedback>(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

// 13. AuditLog Schema
const AuditLogSchema = new Schema<AuditLogEntry>(
  {
    _id: { type: String, required: true },
    actor: { type: String, required: true, index: true },
    actorName: { type: String },
    role: { type: String, enum: ['student', 'organizer', 'admin'], required: true },
    adminLevel: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'] },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    timestamp: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false, versionKey: false }
);

export const UserModel: Model<User> =
  mongoose.models.ParisarUser || mongoose.model<User>('ParisarUser', UserSchema);

export const OrganizerRequestModel: Model<OrganizerVerificationRequest> =
  mongoose.models.ParisarOrganizerRequest ||
  mongoose.model<OrganizerVerificationRequest>('ParisarOrganizerRequest', OrganizerRequestSchema);

export const VenueModel: Model<CampusVenue> =
  mongoose.models.ParisarVenue || mongoose.model<CampusVenue>('ParisarVenue', CampusVenueSchema);

export const EventModel: Model<CampusEvent> =
  mongoose.models.ParisarEvent || mongoose.model<CampusEvent>('ParisarEvent', EventSchemaCompat());

function EventSchemaCompat() {
  return CampusEventSchema;
}

export const RegistrationModel: Model<Registration> =
  mongoose.models.ParisarRegistration ||
  mongoose.model<Registration>('ParisarRegistration', RegistrationSchema);

export const AttendanceModel: Model<AttendanceRecord> =
  mongoose.models.ParisarAttendance ||
  mongoose.model<AttendanceRecord>('ParisarAttendance', AttendanceRecordSchema);

export const TempAttendanceTokenModel: Model<TemporaryAttendanceToken> =
  mongoose.models.ParisarTempAttendanceToken ||
  mongoose.model<TemporaryAttendanceToken>('ParisarTempAttendanceToken', TempAttendanceTokenSchema);

export const AttendanceSessionModel: Model<AttendanceSession> =
  mongoose.models.ParisarAttendanceSession ||
  mongoose.model<AttendanceSession>('ParisarAttendanceSession', AttendanceSessionSchema);

export const CertificateModel: Model<Certificate> =
  mongoose.models.ParisarCertificate ||
  mongoose.model<Certificate>('ParisarCertificate', CertificateSchema);

export const NotificationModel: Model<CampusNotification> =
  mongoose.models.ParisarNotification ||
  mongoose.model<CampusNotification>('ParisarNotification', NotificationSchema);

export const FeedbackModel: Model<EventFeedback> =
  mongoose.models.ParisarFeedback ||
  mongoose.model<EventFeedback>('ParisarFeedback', FeedbackSchema);

export const AuditLogModel: Model<AuditLogEntry> =
  mongoose.models.ParisarAuditLog ||
  mongoose.model<AuditLogEntry>('ParisarAuditLog', AuditLogSchema);
