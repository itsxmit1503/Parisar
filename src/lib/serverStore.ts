import {
  User,
  CampusEvent,
  Registration,
  AttendanceRecord,
  Certificate,
  CampusNotification,
  EventFeedback,
  OrganizerVerificationRequest,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_CERTIFICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEEDBACK,
  INITIAL_ORGANIZER_REQUESTS,
} from './mockData';

// ==============================================================================
// PARISAR Shared Backend Database Store (Web + Android Single Source of Truth)
// ==============================================================================

export interface ParisarSharedDatabase {
  users: User[];
  organizerRequests: OrganizerVerificationRequest[];
  events: CampusEvent[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  certificates: Certificate[];
  notifications: CampusNotification[];
  feedback: EventFeedback[];
  updatedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __PARISAR_SHARED_DB__: ParisarSharedDatabase | undefined;
}

function createInitialStore(): ParisarSharedDatabase {
  return {
    users: [...INITIAL_USERS],
    organizerRequests: [...INITIAL_ORGANIZER_REQUESTS],
    events: [...INITIAL_EVENTS],
    registrations: [...INITIAL_REGISTRATIONS],
    attendance: [...INITIAL_ATTENDANCE],
    certificates: [...INITIAL_CERTIFICATES],
    notifications: [...INITIAL_NOTIFICATIONS],
    feedback: [...INITIAL_FEEDBACK],
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
 * Simple deterministic token/session generator for PARISAR Auth API
 */
export function createAuthToken(user: User): string {
  const payload = {
    sub: user._id,
    email: user.email,
    rollNumber: user.rollNumber,
    role: user.role,
    organizerStatus: user.organizerStatus,
    iat: Date.now(),
  };
  return `parisar_tok_${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
}
