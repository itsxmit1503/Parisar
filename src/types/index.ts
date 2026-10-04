// ==================================================
// PARISAR Domain Types & Schemas
// Dr. Harisingh Gour Vishwavidyalaya, Sagar (DHSGSU)
// ==================================================

export type UserRole = 'student' | 'organizer' | 'admin';

export type AdminLevel = 'SUPER_ADMIN' | 'ADMIN';

export type AdminAccountStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export type AdminPermission =
  | 'MANAGE_ORGANIZERS'
  | 'MANAGE_EVENTS'
  | 'MANAGE_USERS'
  | 'MANAGE_ATTENDANCE'
  | 'MANAGE_CERTIFICATES'
  | 'MANAGE_VENUES'
  | 'MANAGE_ADMINS'
  | 'VIEW_AUDIT_LOG'
  | 'MANAGE_SECURITY';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'MANAGE_ORGANIZERS',
  'MANAGE_EVENTS',
  'MANAGE_USERS',
  'MANAGE_ATTENDANCE',
  'MANAGE_CERTIFICATES',
  'MANAGE_VENUES',
  'MANAGE_ADMINS',
  'VIEW_AUDIT_LOG',
  'MANAGE_SECURITY',
];

export interface RegisteredDevice {
  deviceId: string;
  platform: 'web' | 'mobile';
  deviceName: string;
  verifiedAt: string;
  lastActiveAt: string;
}

export interface UserNotificationPreferences {
  emailConfirmations: boolean;
  eventReminders: boolean;
  venueChanges: boolean;
  certificateAlerts: boolean;
}

export interface UserPrivacyPreferences {
  showProfileToOrganizers: boolean;
  showParticipationInPassport?: boolean;
  showPassportPublicly?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  rollNumber?: string;
  universityId?: string;
  adminId?: string;
  department: string;
  semester?: number;
  role: UserRole;
  adminLevel?: AdminLevel;
  permissions?: AdminPermission[];
  adminPermissions?: AdminPermission[];
  status?: AdminAccountStatus;
  adminAccountStatus?: AdminAccountStatus;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  lastPasswordChangeAt?: string;
  mustChangePassword?: boolean;
  createdBy?: string;
  createdByAdminId?: string;
  invitationTokenHash?: string | null;
  invitationExpiresAt?: string | null;
  resetTokenHash?: string | null;
  resetExpiresAt?: string | null;
  interests: string[];
  profileImage: string;
  bio?: string;
  preferredLanguage?: 'en' | 'hi';
  notificationPreferences?: UserNotificationPreferences;
  privacyPreferences?: UserPrivacyPreferences;
  designation?: string;
  organization?: string;
  phone?: string;
  organizerStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  organizerRequest?: OrganizerVerificationRequest;
  registeredDevices?: RegisteredDevice[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerVerificationRequest {
  id: string;
  userId: string;
  fullName: string;
  universityId: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export type EventCategory =
  | 'Seminar'
  | 'Workshop'
  | 'Cultural'
  | 'Competition'
  | 'Sports'
  | 'Technology'
  | 'Coding'
  | 'Entrepreneurship'
  | 'Academic'
  | 'Club'
  | 'Placement'
  | 'Other'
  | 'Workshops'
  | 'Seminars'
  | 'Competitions'
  | 'Cultural Events'
  | 'Career';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type EventMode = 'OFFLINE' | 'ONLINE' | 'HYBRID';

export type AttendanceSessionStatus = 'NOT_STARTED' | 'OPEN' | 'ACTIVE' | 'FINALIZED' | 'CLOSED';

export type CampusLocationCategory =
  | 'Academic'
  | 'Event Venue'
  | 'Library'
  | 'Sports'
  | 'Hostel'
  | 'Administration'
  | 'Food'
  | 'Medical'
  | 'Other';

export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified';

export interface CampusVenue {
  id: string;
  name: string;
  secondaryName?: string;
  plusCode?: string;
  category: CampusLocationCategory;
  latitude: number | null;
  longitude: number | null;
  description: string;
  address: string;
  verified: VerificationStatus;
  source: string;
  navigationQuery: string;
  isEventVenue?: boolean;
  building?: string;
  floor?: string;
  capacity?: number;
  coordinates?: { x: number; y: number };
  features?: string[];
  directions?: string;
}

export type CampusLocation = CampusVenue;

export interface OnlineAttendancePolicy {
  initialCheckInRequired?: boolean;
  totalCheckpoints: number;
  checkpointValiditySeconds: number;
  requiredCheckpoints: number;
  minParticipationPercent?: number;
}

export interface CampusEvent {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventMode?: EventMode;
  onlineLink?: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  venue: string;
  venueId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registrationCount: number;
  registrationDeadline: string;
  tags: string[];
  coverImage: string;
  status: EventStatus;
  eligibility?: string;
  specialInstructions?: string;
  departmentScope?: string;
  certificateRequired?: boolean;
  minParticipationPercent?: number;
  onlineAttendancePolicy?: OnlineAttendancePolicy;
  onlinePolicy?: OnlineAttendancePolicy;
  onlineCheckpoints?: OnlineAttendanceCheckpoint[];
  attendanceSessionStatus?: AttendanceSessionStatus;
  attendanceStartedAt?: string;
  attendanceClosedAt?: string;
  attendanceFinalizedAt?: string;
  attendanceFinalizedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  userRollNumber: string;
  userDepartment: string;
  userEmail: string;
  status: RegistrationStatus;
  registeredAt: string;
  qrToken: string;
  checkedInAt?: string | null;
}

export type AttendanceType = 'OFFLINE_QR' | 'ONLINE_SESSION';

export type AttendanceMethod = 'qr' | 'online_session' | 'admin_override' | 'roster' | 'manual';

export type ParticipantSessionStatus =
  | 'JOINED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'PAUSED_DISCONNECTED'
  | 'RESUMED'
  | 'ENDED'
  | 'COMPLETED';

export interface TemporaryAttendanceToken {
  id: string;
  token: string;
  eventId: string;
  studentId: string;
  registrationId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
}

export interface OnlineAttendanceCheckpoint {
  id: string;
  checkpointId?: string;
  sessionId?: string;
  eventId: string;
  studentId?: string;
  checkpointNumber: number;
  triggeredAt: string;
  expiresAt: string;
  verifiedAt?: string | null;
  status: 'ACTIVE' | 'VERIFIED' | 'MISSED' | 'EXPIRED';
}

export interface AttendanceRecord {
  _id: string;
  eventId: string;
  registrationId: string;
  userId: string;
  studentId?: string;
  userName: string;
  userRollNumber: string;
  userDepartment: string;
  attendanceType?: AttendanceType;
  status?: 'PRESENT' | 'ABSENT' | 'IN_PROGRESS';
  checkedInAt: string;
  checkedOutAt?: string;
  checkedInBy: string;
  method: AttendanceMethod;
  initialCheckInDone?: boolean;
  verifiedCheckpoints?: string[];
  checkpointsVerified?: number;
  checkpointsRequired?: number;
  checkpointsTotal?: number;
  checkpoints?: OnlineAttendanceCheckpoint[];
  participatedMinutes?: number;
  requiredMinutes?: number;
  totalEventMinutes?: number;
  participationPercent?: number;
  sessionStatus?: ParticipantSessionStatus;
  lastValidatedAt?: string;
  eligibleForCertificate?: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CertificateType = 'PARTICIPATION' | 'MERIT' | 'EXCELLENCE';

export interface Certificate {
  _id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userRollNumber: string;
  department: string;
  certificateUrl: string;
  verificationCode: string;
  issuedAt: string;
  certificateType: CertificateType;
  issueAuthorizedBy: string;
  academicAuthority?: string;
  participationPercent?: number;
  participatedMinutes?: number;
}

export type NotificationType =
  | 'REGISTRATION_CONFIRMED'
  | 'EVENT_REMINDER'
  | 'VENUE_CHANGED'
  | 'TIME_CHANGED'
  | 'EVENT_CANCELLED'
  | 'DEADLINE_APPROACHING'
  | 'CERTIFICATE_ISSUED'
  | 'ANNOUNCEMENT';

export interface CampusNotification {
  _id: string;
  userId: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface EventFeedback {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: string;
  unlockedAt?: string;
  progress?: number;
  total?: number;
}

export interface PassportStats {
  totalAttended: number;
  workshopsCount: number;
  seminarsCount: number;
  competitionsCount: number;
  culturalCount: number;
  sportsCount: number;
  careerCount: number;
  certificatesEarned: number;
  totalHours: number;
  achievements: AchievementBadge[];
}

export interface AttendanceSession {
  id: string;
  eventId: string;
  studentId?: string;
  registrationId?: string;
  organizerId?: string;
  joinedAt?: string;
  leftAt?: string;
  startedAt?: string;
  endedAt?: string;
  verifiedDuration?: number;
  mode?: EventMode;
  minimumParticipationPercent?: number;
  checkpoints?: OnlineAttendanceCheckpoint[];
  checkpointsVerified?: number;
  checkpointsRequired?: number;
  checkpointsTotal?: number;
  status:
    | 'NOT_STARTED'
    | 'OPEN'
    | 'ACTIVE'
    | 'PAUSED'
    | 'DISCONNECTED'
    | 'RESUMED'
    | 'ENDED'
    | 'FINALIZED'
    | 'CLOSED';
  deviceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AuditAction =
  | 'ADMIN_LOGIN_SUCCESS'
  | 'ADMIN_LOGIN_FAILED'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_CREATED'
  | 'ADMIN_INVITED'
  | 'ADMIN_ACTIVATED'
  | 'ADMIN_SUSPENDED'
  | 'ADMIN_REVOKED'
  | 'ADMIN_ROLE_CHANGED'
  | 'ADMIN_PERMISSION_CHANGED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'SESSION_REVOKED'
  | 'ORGANIZER_APPROVED'
  | 'ORGANIZER_REJECTED'
  | 'EVENT_APPROVED'
  | 'EVENT_REJECTED'
  | 'ATTENDANCE_FINALIZED'
  | 'ATTENDANCE_CORRECTED'
  | 'USER_ROLE_CHANGED'
  | 'VENUE_UPDATED'
  // Legacy / general operational audit actions:
  | 'LOGIN'
  | 'LOGOUT'
  | 'STUDENT_REGISTERED'
  | 'ORGANIZER_REQUEST'
  | 'EVENT_CREATED'
  | 'EVENT_SUBMITTED'
  | 'EVENT_CANCELLED'
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_CANCELLED'
  | 'ATTENDANCE_STARTED'
  | 'ATTENDANCE_CHECKIN'
  | 'ATTENDANCE_CHECKOUT'
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_ADMIN_OVERRIDE'
  | 'ONLINE_SESSION_JOINED'
  | 'ONLINE_SESSION_LEFT'
  | 'ONLINE_CHECKPOINT_TRIGGERED'
  | 'ONLINE_CHECKPOINT_VERIFIED'
  | 'ONLINE_CHECKPOINT_MISSED'
  | 'CERTIFICATE_ISSUED'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_REVOKED'
  | 'ADMIN_ROLE_CHANGE'
  | 'PROFILE_UPDATED';

export interface AuditLogEntry {
  _id: string;
  actor: string;
  actorName?: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  action: AuditAction;
  entity: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type ScanVerificationResult =
  | {
      status: 'SUCCESS';
      message: string;
      registration: Registration;
      event: CampusEvent;
      attendee: User;
      checkedInAt?: string;
    }
  | {
      status: 'ALREADY_PRESENT' | 'DUPLICATE';
      message: string;
      registration: Registration;
      event: CampusEvent;
      attendee: User;
      checkedInAt: string;
    }
  | {
      status: 'NOT_REGISTERED';
      message: string;
      registration?: Registration;
      event?: CampusEvent;
      attendee?: User;
      checkedInAt?: string;
    }
  | {
      status: 'WRONG_EVENT';
      message: string;
      intendedEventTitle?: string;
      currentEventTitle: string;
      registration?: Registration;
      event?: CampusEvent;
      attendee?: User;
      checkedInAt?: string;
    }
  | {
      status: 'EXPIRED';
      message: string;
      registration?: Registration;
      event?: CampusEvent;
      attendee?: User;
      checkedInAt?: string;
    }
  | {
      status: 'INVALID';
      message: string;
      registration?: Registration;
      event?: CampusEvent;
      attendee?: User;
      checkedInAt?: string;
    };

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
