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
  createdAt: string;
  updatedAt: string;
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
  | 'Career';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface CampusVenue {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  coordinates: { x: number; y: number }; // Percentage for campus map coordinates
  features: string[];
  directions: string;
}

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
