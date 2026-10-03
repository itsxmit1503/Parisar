// ==================================================
// PARISAR Domain Types & Schemas
// Dr. Harisingh Gour Vishwavidyalaya, Sagar (DHSGSU)
// ==================================================

export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  rollNumber?: string;
  department: string;
  semester?: number;
  role: UserRole;
  interests: string[];
  profileImage: string;
  designation?: string;
  organization?: string;
  phone?: string;
  organizerStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  organizerRequest?: OrganizerVerificationRequest;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerVerificationRequest {
  id: string;
  userId: string;
  fullName: string;
  universityId: string; // Roll number or Employee ID (e.g. Y23141042 or EMP-DCSA-104)
  department: string;
  designation: string; // e.g. "Convener / Faculty" or "Student Society Lead"
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
  // Backward compatibility aliases:
  | 'Workshops'
  | 'Seminars'
  | 'Competitions'
  | 'Cultural Events'
  | 'Career';

export type EventStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

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
  // Optional legacy fields retained only for TypeScript compatibility
  building?: string;
  floor?: string;
  capacity?: number;
  coordinates?: { x: number; y: number };
  features?: string[];
  directions?: string;
}

export type CampusLocation = CampusVenue;

export interface CampusEvent {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  venue: string;
  venueId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  capacity: number;
  registrationCount: number;
  registrationDeadline: string; // ISO String
  tags: string[];
  coverImage: string;
  status: EventStatus;
  eligibility?: string;
  specialInstructions?: string;
  departmentScope?: string; // e.g. "Department of Computer Science & Applications" or "Open to all DHSGSU"
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

export type AttendanceMethod = 'qr' | 'manual';

export interface AttendanceRecord {
  _id: string;
  eventId: string;
  registrationId: string;
  userId: string;
  userName: string;
  userRollNumber: string;
  userDepartment: string;
  checkedInAt: string;
  checkedInBy: string;
  method: AttendanceMethod;
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
  academicAuthority?: string; // e.g. "Office of the Dean of Students' Welfare (DSW), DHSGSU"
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
  rating: number; // 1 to 5
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

export type ScanVerificationResult = 
  | { status: 'SUCCESS'; message: string; registration: Registration; event: CampusEvent; attendee: User }
  | { status: 'DUPLICATE'; message: string; registration: Registration; event: CampusEvent; attendee: User; checkedInAt: string }
  | { status: 'WRONG_EVENT'; message: string; intendedEventTitle?: string; currentEventTitle: string }
  | { status: 'INVALID'; message: string };

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
