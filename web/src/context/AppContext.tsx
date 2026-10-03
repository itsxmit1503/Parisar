'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  CampusEvent, 
  CampusVenue, 
  Registration, 
  AttendanceRecord, 
  Certificate, 
  CampusNotification, 
  EventFeedback, 
  PassportStats,
  ScanVerificationResult,
  ApiResponse,
  EventStatus,
  OrganizerVerificationRequest
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
  PASSPORT_ACHIEVEMENTS,
  INITIAL_ORGANIZER_REQUESTS
} from '../lib/mockData';

interface AppContextType {
  // Current session & Auth state
  currentUser: User;
  isAuthenticated: boolean;
  authToken: string | null;
  setCurrentUserId: (id: string) => void;
  loginWithCredentials: (identifier: string, password?: string, adminOnly?: boolean) => Promise<ApiResponse<User>>;
  registerStudentAccount: (data: {
    name: string;
    rollNumber: string;
    email: string;
    department: string;
    semester: number;
    password?: string;
  }) => Promise<ApiResponse<User>>;
  registerOrganizerAccount: (data: {
    name: string;
    universityId: string;
    email: string;
    department: string;
    designation: string;
    phone: string;
    reason: string;
    password?: string;
  }) => Promise<ApiResponse<User>>;
  resubmitOrganizerVerification: (reason: string, designation?: string, department?: string) => ApiResponse<OrganizerVerificationRequest>;
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'department' | 'semester' | 'designation' | 'phone' | 'organization'>>) => ApiResponse<User>;
  logout: () => void;
  allUsers: User[];
  
  // Data collections
  events: CampusEvent[];
  venues: CampusVenue[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  certificates: Certificate[];
  notifications: CampusNotification[];
  feedback: EventFeedback[];
  
  // Student Actions
  registerForEvent: (eventId: string) => ApiResponse<Registration>;
  cancelRegistration: (registrationId: string) => ApiResponse<boolean>;
  submitFeedback: (eventId: string, rating: number, comment: string) => ApiResponse<EventFeedback>;
  updateUserInterests: (interests: string[]) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  getRecommendedEvents: () => CampusEvent[];
  getStudentPassportStats: (userId?: string) => PassportStats;
  
  // Organizer Actions
  createEvent: (eventData: Omit<CampusEvent, '_id' | 'organizerId' | 'organizerName' | 'organizerEmail' | 'registrationCount' | 'createdAt' | 'updatedAt'>, asDraft?: boolean) => ApiResponse<CampusEvent>;
  updateEvent: (eventId: string, updates: Partial<CampusEvent>) => ApiResponse<CampusEvent>;
  verifyAndCheckIn: (eventId: string, qrToken: string, method?: 'qr' | 'manual') => ScanVerificationResult;
  sendAnnouncement: (eventId: string, title: string, message: string) => ApiResponse<number>;
  issueCertificatesForEvent: (eventId: string) => ApiResponse<number>;
  
  // Admin Actions
  organizerRequests: OrganizerVerificationRequest[];
  adminReviewOrganizerRequest: (requestId: string, approve: boolean, remarks?: string) => ApiResponse<OrganizerVerificationRequest>;
  adminModerateEvent: (eventId: string, newStatus: EventStatus) => ApiResponse<CampusEvent>;
  adminUpdateUserRole: (userId: string, newRole: User['role']) => ApiResponse<User>;
  
  // Prototype controls
  resetPrototypeData: () => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'parisar_dhsgsu_v2_';

// Helper to merge two user lists without losing created accounts from either client or backend
function mergeUsersList(serverUsers: User[], clientUsers: User[]): User[] {
  const merged = [...serverUsers];
  for (const cu of clientUsers) {
    if (!cu || !cu.email) continue;
    const idx = merged.findIndex(
      su =>
        su._id === cu._id ||
        su.email.toLowerCase() === cu.email.toLowerCase() ||
        (cu.rollNumber &&
          su.rollNumber &&
          su.rollNumber.toUpperCase() === cu.rollNumber.toUpperCase())
    );
    if (idx === -1) {
      merged.unshift(cu);
    } else {
      merged[idx] = {
        ...merged[idx],
        ...cu,
        organizerStatus:
          merged[idx].organizerStatus === 'VERIFIED'
            ? 'VERIFIED'
            : cu.organizerStatus || merged[idx].organizerStatus,
        passwordHash: cu.passwordHash || merged[idx].passwordHash,
      };
    }
  }
  return merged;
}

const LEGACY_VENUE_ID_MAP: Record<string, string> = {
  'venue-tagore-mandapam': 'venue-abhimanch',
  'venue-swarna-jayanti': 'venue-abhimanch',
  'venue-iic': 'venue-central-library',
  'venue-cv-raman': 'venue-geography-dept',
  'venue-sports-complex': 'venue-stadium',
  'venue-law-moot': 'venue-law-hall',
};

function normalizeEventVenues(eventsList: CampusEvent[]): CampusEvent[] {
  return eventsList.map(evt => {
    const seedEvt = INITIAL_EVENTS.find(se => se._id === evt._id);
    const mappedId = seedEvt ? seedEvt.venueId : (LEGACY_VENUE_ID_MAP[evt.venueId] || evt.venueId);
    const matchedVenue = CAMPUS_VENUES.find(v => v.id === mappedId);
    if (matchedVenue) {
      return {
        ...evt,
        venueId: matchedVenue.id,
        venue: matchedVenue.name,
        description: seedEvt ? seedEvt.description : evt.description,
      };
    }
    return evt;
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [currentUserId, setCurrentUserIdState] = useState<string>('student-1');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);
  const [venues] = useState<CampusVenue[]>(CAMPUS_VENUES);
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [notifications, setNotifications] = useState<CampusNotification[]>(INITIAL_NOTIFICATIONS);
  const [feedback, setFeedback] = useState<EventFeedback[]>(INITIAL_FEEDBACK);
  const [organizerRequests, setOrganizerRequests] = useState<OrganizerVerificationRequest[]>(INITIAL_ORGANIZER_REQUESTS);

  // Load cached state and synchronize with shared PARISAR Auth API (/api/v1/auth)
  useEffect(() => {
    let localUsersSnapshot: User[] = INITIAL_USERS;
    let localReqsSnapshot: OrganizerVerificationRequest[] = INITIAL_ORGANIZER_REQUESTS;

    try {
      const storedUsers = localStorage.getItem(`${STORAGE_PREFIX}users`);
      if (storedUsers) {
        localUsersSnapshot = mergeUsersList(INITIAL_USERS, JSON.parse(storedUsers));
        setAllUsers(localUsersSnapshot);
      }

      const storedEvents = localStorage.getItem(`${STORAGE_PREFIX}events`);
      if (storedEvents) setEvents(normalizeEventVenues(JSON.parse(storedEvents)));

      const storedRegs = localStorage.getItem(`${STORAGE_PREFIX}registrations`);
      if (storedRegs) setRegistrations(JSON.parse(storedRegs));

      const storedAtt = localStorage.getItem(`${STORAGE_PREFIX}attendance`);
      if (storedAtt) setAttendance(JSON.parse(storedAtt));

      const storedCerts = localStorage.getItem(`${STORAGE_PREFIX}certificates`);
      if (storedCerts) setCertificates(JSON.parse(storedCerts));

      const storedNotifs = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
      if (storedNotifs) setNotifications(JSON.parse(storedNotifs));

      const storedFb = localStorage.getItem(`${STORAGE_PREFIX}feedback`);
      if (storedFb) setFeedback(JSON.parse(storedFb));

      const storedReqs = localStorage.getItem(`${STORAGE_PREFIX}organizerRequests`);
      if (storedReqs) {
        localReqsSnapshot = JSON.parse(storedReqs);
        setOrganizerRequests(localReqsSnapshot);
      }

      const storedUser = localStorage.getItem(`${STORAGE_PREFIX}currentUserId`);
      if (storedUser) setCurrentUserIdState(storedUser);

      const storedToken = localStorage.getItem(`${STORAGE_PREFIX}authToken`);
      if (storedToken) setAuthToken(storedToken);

      const storedAuth = localStorage.getItem(`${STORAGE_PREFIX}isAuthenticated`);
      if (storedAuth === 'true') setIsAuthenticated(true);
    } catch {
      // Fallback to initial seed data if storage error
    } finally {
      setIsLoaded(true);
    }

    // Sync any locally cached accounts up to the shared server database AND pull shared accounts down
    (async () => {
      try {
        const res = await fetch('/api/v1/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync-state',
            users: localUsersSnapshot,
            organizerRequests: localReqsSnapshot,
          }),
        });
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.data) {
            if (Array.isArray(payload.data.users)) {
              setAllUsers(prev => mergeUsersList(payload.data.users, prev));
            }
            if (Array.isArray(payload.data.organizerRequests)) {
              setOrganizerRequests(payload.data.organizerRequests);
            }
          }
        }
      } catch {
        // Offline or network unavailable — continue with cached session
      }
    })();
  }, []);

  // Save session cache when collections change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(allUsers));
      localStorage.setItem(`${STORAGE_PREFIX}events`, JSON.stringify(events));
      localStorage.setItem(`${STORAGE_PREFIX}registrations`, JSON.stringify(registrations));
      localStorage.setItem(`${STORAGE_PREFIX}attendance`, JSON.stringify(attendance));
      localStorage.setItem(`${STORAGE_PREFIX}certificates`, JSON.stringify(certificates));
      localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_PREFIX}feedback`, JSON.stringify(feedback));
      localStorage.setItem(`${STORAGE_PREFIX}organizerRequests`, JSON.stringify(organizerRequests));
      localStorage.setItem(`${STORAGE_PREFIX}currentUserId`, currentUserId);
      localStorage.setItem(`${STORAGE_PREFIX}isAuthenticated`, String(isAuthenticated));
      if (authToken) {
        localStorage.setItem(`${STORAGE_PREFIX}authToken`, authToken);
      } else {
        localStorage.removeItem(`${STORAGE_PREFIX}authToken`);
      }
    } catch (e) {
      console.warn('Storage quota or persistence warning:', e);
    }
  }, [isLoaded, allUsers, events, registrations, attendance, certificates, notifications, feedback, organizerRequests, currentUserId, isAuthenticated, authToken]);

  const currentUser = allUsers.find(u => u._id === currentUserId) || allUsers[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}isAuthenticated`, 'false');
      localStorage.removeItem(`${STORAGE_PREFIX}authToken`);
    } catch {
      // ignore
    }
  };

  const loginWithCredentials = async (
    identifier: string,
    password?: string,
    adminOnly = false
  ): Promise<ApiResponse<User>> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return {
        success: false,
        error: {
          code: 'EMPTY_IDENTIFIER',
          message: 'Account not found. Check your email or roll number.',
        },
      };
    }

    if (password !== undefined && !password.trim()) {
      return {
        success: false,
        error: {
          code: 'EMPTY_PASSWORD',
          message: 'Incorrect password.',
        },
      };
    }

    // 1. First sync any locally known accounts and authenticate against the shared PARISAR Auth API
    try {
      await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync-state',
          users: allUsers,
          organizerRequests,
        }),
      });

      const apiRes = await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: identifier.trim(),
          password,
          adminOnly,
        }),
      });

      const payload = await apiRes.json();
      if (apiRes.ok && payload.success && payload.data?.user) {
        const authedUser: User = payload.data.user;
        if (Array.isArray(payload.data.users)) {
          setAllUsers(prev => mergeUsersList(payload.data.users, [authedUser, ...prev]));
        } else {
          setAllUsers(prev => mergeUsersList([authedUser], prev));
        }
        if (Array.isArray(payload.data.organizerRequests)) {
          setOrganizerRequests(payload.data.organizerRequests);
        }
        setCurrentUserIdState(authedUser._id);
        setAuthToken(payload.data.token || `parisar_session_${authedUser._id}`);
        setIsAuthenticated(true);
        return { success: true, data: authedUser };
      }

      if (!apiRes.ok && payload.error) {
        return {
          success: false,
          error: payload.error,
        };
      }
    } catch {
      // Network error fallback: check merged local store
    }

    // 2. Fallback check in merged user list
    const found = allUsers.find(
      u =>
        u.email.toLowerCase() === cleanId ||
        (u.rollNumber && u.rollNumber.toLowerCase() === cleanId) ||
        u._id.toLowerCase() === cleanId
    );

    if (!found) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found. Check your email or roll number.',
        },
      };
    }

    if (found.passwordHash && password !== undefined && found.passwordHash !== password) {
      return {
        success: false,
        error: {
          code: 'INCORRECT_PASSWORD',
          message: 'Incorrect password.',
        },
      };
    }

    if (adminOnly && found.role !== 'admin') {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED_ADMIN',
          message: 'Your account is currently unavailable.',
        },
      };
    }

    setCurrentUserIdState(found._id);
    setAuthToken(`parisar_session_${found._id}`);
    setIsAuthenticated(true);
    return { success: true, data: found };
  };

  const registerStudentAccount = async (data: {
    name: string;
    rollNumber: string;
    email: string;
    department: string;
    semester: number;
    password?: string;
  }): Promise<ApiResponse<User>> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanRoll = data.rollNumber.trim().toUpperCase();

    if (!data.name.trim() || !cleanRoll || !cleanEmail) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full Name, Roll Number, and University Email are mandatory.',
        },
      };
    }

    // 1. Create/Sync Student Account in the shared PARISAR Auth API (/api/v1/auth)
    try {
      const apiRes = await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-student',
          name: data.name.trim(),
          rollNumber: cleanRoll,
          email: cleanEmail,
          department: data.department,
          semester: data.semester,
          password: data.password,
        }),
      });

      const payload = await apiRes.json();
      if (apiRes.ok && payload.success && payload.data?.user) {
        const createdUser: User = payload.data.user;
        if (Array.isArray(payload.data.users)) {
          setAllUsers(prev => mergeUsersList(payload.data.users, [createdUser, ...prev]));
        } else {
          setAllUsers(prev => mergeUsersList([createdUser], prev));
        }
        setCurrentUserIdState(createdUser._id);
        setAuthToken(payload.data.token || `parisar_session_${createdUser._id}`);
        setIsAuthenticated(true);
        return { success: true, data: createdUser };
      }

      if (!apiRes.ok && payload.error) {
        return {
          success: false,
          error: payload.error,
        };
      }
    } catch {
      // Fallback if offline
    }

    const nowIso = new Date().toISOString();
    const existingIdx = allUsers.findIndex(
      u => u.email.toLowerCase() === cleanEmail || (u.rollNumber && u.rollNumber.toUpperCase() === cleanRoll)
    );

    if (existingIdx !== -1) {
      const updatedUser: User = {
        ...allUsers[existingIdx],
        name: data.name.trim(),
        email: cleanEmail,
        rollNumber: cleanRoll,
        department: data.department,
        semester: data.semester,
        passwordHash: data.password || allUsers[existingIdx].passwordHash,
        updatedAt: nowIso,
      };
      setAllUsers(prev => prev.map((u, idx) => (idx === existingIdx ? updatedUser : u)));
      setCurrentUserIdState(updatedUser._id);
      setAuthToken(`parisar_session_${updatedUser._id}`);
      setIsAuthenticated(true);
      return { success: true, data: updatedUser };
    }

    const newUser: User = {
      _id: `stu-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      rollNumber: cleanRoll,
      department: data.department,
      semester: data.semester,
      role: 'student',
      passwordHash: data.password,
      organizerStatus: 'NONE',
      interests: ['Workshop', 'Seminar', 'Cultural', 'Competition'],
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      phone: '+91 98260 00000',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUserIdState(newUser._id);
    setAuthToken(`parisar_session_${newUser._id}`);
    setIsAuthenticated(true);
    return { success: true, data: newUser };
  };

  const registerOrganizerAccount = async (data: {
    name: string;
    universityId: string;
    email: string;
    department: string;
    designation: string;
    phone: string;
    reason: string;
    password?: string;
  }): Promise<ApiResponse<User>> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanId = data.universityId.trim().toUpperCase();

    if (!data.name.trim() || !cleanId || !cleanEmail || !data.reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full Name, University ID, Email, and Justification for organizing are mandatory.',
        },
      };
    }

    // 1. Create Organizer Account in shared PARISAR Auth API (/api/v1/auth)
    try {
      const apiRes = await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-organizer',
          name: data.name.trim(),
          universityId: cleanId,
          email: cleanEmail,
          department: data.department,
          designation: data.designation.trim() || 'Event Convener Applicant',
          phone: data.phone.trim() || '+91 98260 00000',
          reason: data.reason.trim(),
          password: data.password,
        }),
      });

      const payload = await apiRes.json();
      if (apiRes.ok && payload.success && payload.data?.user) {
        const createdUser: User = payload.data.user;
        if (Array.isArray(payload.data.users)) {
          setAllUsers(prev => mergeUsersList(payload.data.users, [createdUser, ...prev]));
        } else {
          setAllUsers(prev => mergeUsersList([createdUser], prev));
        }
        if (Array.isArray(payload.data.organizerRequests)) {
          setOrganizerRequests(payload.data.organizerRequests);
        }
        setCurrentUserIdState(createdUser._id);
        setAuthToken(payload.data.token || `parisar_session_${createdUser._id}`);
        setIsAuthenticated(true);
        return { success: true, data: createdUser };
      }

      if (!apiRes.ok && payload.error) {
        return {
          success: false,
          error: payload.error,
        };
      }
    } catch {
      // Fallback if offline
    }

    const nowIso = new Date().toISOString();
    const userId = `org-applicant-${Date.now()}`;
    const reqId = `req-${Date.now()}`;

    const newReq: OrganizerVerificationRequest = {
      id: reqId,
      userId,
      fullName: data.name.trim(),
      universityId: cleanId,
      department: data.department,
      designation: data.designation.trim() || 'Event Convener Applicant',
      email: cleanEmail,
      phone: data.phone.trim() || '+91 98260 00000',
      reason: data.reason.trim(),
      status: 'PENDING',
      submittedAt: nowIso,
    };

    const newUser: User = {
      _id: userId,
      name: data.name.trim(),
      email: cleanEmail,
      rollNumber: cleanId,
      department: data.department,
      designation: data.designation.trim() || 'Event Convener Applicant',
      organization: data.department,
      role: 'organizer',
      organizerStatus: 'PENDING',
      organizerRequest: newReq,
      passwordHash: data.password,
      interests: ['Seminar', 'Workshop', 'Competition'],
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
      phone: data.phone.trim() || '+91 98260 00000',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setOrganizerRequests(prev => [newReq, ...prev]);
    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUserIdState(newUser._id);
    setAuthToken(`parisar_session_${newUser._id}`);
    setIsAuthenticated(true);
    return { success: true, data: newUser };
  };

  const resubmitOrganizerVerification = (reason: string, designation?: string, department?: string): ApiResponse<OrganizerVerificationRequest> => {
    if (!reason.trim()) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide an updated justification for organizer verification.' } };
    }

    const nowIso = new Date().toISOString();
    const existingReq = organizerRequests.find(r => r.userId === currentUser._id || r.email === currentUser.email);

    const updatedReq: OrganizerVerificationRequest = existingReq
      ? {
          ...existingReq,
          reason: reason.trim(),
          designation: designation?.trim() || existingReq.designation,
          department: department || existingReq.department,
          status: 'PENDING',
          submittedAt: nowIso,
          reviewedAt: undefined,
          reviewRemarks: undefined,
        }
      : {
          id: `req-${Date.now()}`,
          userId: currentUser._id,
          fullName: currentUser.name,
          universityId: currentUser.rollNumber || 'EMP-DHSGSU',
          department: department || currentUser.department,
          designation: designation?.trim() || currentUser.designation || 'Faculty / Society Organizer',
          email: currentUser.email,
          phone: currentUser.phone || '+91 98260 00000',
          reason: reason.trim(),
          status: 'PENDING',
          submittedAt: nowIso,
        };

    if (existingReq) {
      setOrganizerRequests(prev => prev.map(r => r.id === existingReq.id ? updatedReq : r));
    } else {
      setOrganizerRequests(prev => [updatedReq, ...prev]);
    }

    setAllUsers(prev => prev.map(u => u._id === currentUser._id ? {
      ...u,
      role: 'organizer',
      organizerStatus: 'PENDING',
      designation: designation?.trim() || u.designation,
      department: department || u.department,
      updatedAt: nowIso,
    } : u));

    return { success: true, data: updatedReq };
  };

  const updateUserProfile = (updates: Partial<Pick<User, 'name' | 'department' | 'semester' | 'designation' | 'phone' | 'organization'>>): ApiResponse<User> => {
    const nowIso = new Date().toISOString();
    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: nowIso,
    };
    setAllUsers(prev => prev.map(u => u._id === currentUser._id ? updatedUser : u));
    return { success: true, data: updatedUser };
  };

  const resetPrototypeData = () => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}users`);
      localStorage.removeItem(`${STORAGE_PREFIX}events`);
      localStorage.removeItem(`${STORAGE_PREFIX}registrations`);
      localStorage.removeItem(`${STORAGE_PREFIX}attendance`);
      localStorage.removeItem(`${STORAGE_PREFIX}certificates`);
      localStorage.removeItem(`${STORAGE_PREFIX}notifications`);
      localStorage.removeItem(`${STORAGE_PREFIX}feedback`);
      localStorage.removeItem(`${STORAGE_PREFIX}organizerRequests`);
      localStorage.removeItem(`${STORAGE_PREFIX}currentUserId`);
      localStorage.removeItem(`${STORAGE_PREFIX}isAuthenticated`);
    } catch {
      // ignore
    }
    setAllUsers(INITIAL_USERS);
    setEvents(INITIAL_EVENTS);
    setRegistrations(INITIAL_REGISTRATIONS);
    setAttendance(INITIAL_ATTENDANCE);
    setCertificates(INITIAL_CERTIFICATES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setFeedback(INITIAL_FEEDBACK);
    setOrganizerRequests(INITIAL_ORGANIZER_REQUESTS);
    setCurrentUserIdState('student-1');
    setIsAuthenticated(false);
  };

  // ==========================================
  // Student Operations (Sections 16, 17, 18, 45, 46)
  // ==========================================
  const registerForEvent = (eventId: string): ApiResponse<Registration> => {
    const targetEvent = events.find(e => e._id === eventId);
    if (!targetEvent) {
      return { success: false, error: { code: 'EVENT_NOT_FOUND', message: 'Requested event could not be found.' } };
    }

    if (targetEvent.status !== 'PUBLISHED' && targetEvent.status !== 'APPROVED') {
      return { success: false, error: { code: 'EVENT_NOT_OPEN', message: 'Registration is only open for officially approved DHSGSU events.' } };
    }

    const now = new Date('2026-09-30T10:00:00Z');
    const deadline = new Date(targetEvent.registrationDeadline);
    if (now > deadline) {
      return { success: false, error: { code: 'REGISTRATION_CLOSED', message: 'The registration deadline for this event has passed.' } };
    }

    // Atomic capacity check
    if (targetEvent.registrationCount >= targetEvent.capacity) {
      return { success: false, error: { code: 'EVENT_FULL', message: 'This event has reached its maximum participant capacity.' } };
    }

    // Duplicate check: eventId + userId
    const existing = registrations.find(r => r.eventId === eventId && r.userId === currentUser._id && r.status === 'CONFIRMED');
    if (existing) {
      return { success: false, error: { code: 'ALREADY_REGISTERED', message: 'You already hold a verified registration pass for this event.' } };
    }

    // Secure Pass Token generator
    const codeCategory = targetEvent.category.slice(0, 3).toUpperCase();
    const cleanRoll = (currentUser.rollNumber || 'STU').replace(/[^a-zA-Z0-9]/g, '');
    const randomSalt = Math.floor(1000 + Math.random() * 9000);
    const qrToken = `PARISAR-PASS-${codeCategory}-${cleanRoll}-${randomSalt}`;

    const newRegistration: Registration = {
      _id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId: targetEvent._id,
      userId: currentUser._id,
      userName: currentUser.name,
      userRollNumber: currentUser.rollNumber || 'N/A',
      userDepartment: currentUser.department,
      userEmail: currentUser.email,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString(),
      qrToken: qrToken,
      checkedInAt: null,
    };

    // Update event registration count atomically
    const updatedEvents = events.map(e => {
      if (e._id === eventId) {
        return { ...e, registrationCount: e.registrationCount + 1, updatedAt: new Date().toISOString() };
      }
      return e;
    });

    // Create notification
    const newNotif: CampusNotification = {
      _id: `notif-${Date.now()}`,
      userId: currentUser._id,
      eventId: targetEvent._id,
      type: 'REGISTRATION_CONFIRMED',
      title: `Registration Confirmed: ${targetEvent.title}`,
      message: `Your verified digital pass has been generated. View your pass in 'My Pass' to check in at ${targetEvent.venue}.`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setRegistrations(prev => [newRegistration, ...prev]);
    setEvents(updatedEvents);
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, data: newRegistration };
  };

  const cancelRegistration = (registrationId: string): ApiResponse<boolean> => {
    const reg = registrations.find(r => r._id === registrationId);
    if (!reg) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Registration not found.' } };
    }

    if (reg.checkedInAt) {
      return { success: false, error: { code: 'ALREADY_CHECKED_IN', message: 'Cannot cancel registration after event check-in has been recorded.' } };
    }

    setRegistrations(prev => prev.map(r => r._id === registrationId ? { ...r, status: 'CANCELLED' } : r));

    // Decrement event registration count
    setEvents(prev => prev.map(e => {
      if (e._id === reg.eventId && e.registrationCount > 0) {
        return { ...e, registrationCount: e.registrationCount - 1, updatedAt: new Date().toISOString() };
      }
      return e;
    }));

    return { success: true, data: true };
  };

  const submitFeedback = (eventId: string, rating: number, comment: string): ApiResponse<EventFeedback> => {
    // Check if user attended
    const attended = attendance.some(a => a.eventId === eventId && a.userId === currentUser._id);
    if (!attended) {
      return { success: false, error: { code: 'NOT_ATTENDED', message: 'Feedback is only open to verified event attendees.' } };
    }

    const newFb: EventFeedback = {
      _id: `fb-${Date.now()}`,
      eventId,
      userId: currentUser._id,
      userName: currentUser.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    setFeedback(prev => [newFb, ...prev]);
    return { success: true, data: newFb };
  };

  const updateUserInterests = (interests: string[]) => {
    setAllUsers(prev => prev.map(u => u._id === currentUser._id ? { ...u, interests, updatedAt: new Date().toISOString() } : u));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser._id ? { ...n, read: true } : n));
  };

  // Rule-based, explainable recommendation engine (Section 21)
  const getRecommendedEvents = (): CampusEvent[] => {
    const userInterests = currentUser.interests.map(i => i.toLowerCase());
    
    // Find already registered event IDs
    const registeredIds = new Set(
      registrations
        .filter(r => r.userId === currentUser._id && r.status === 'CONFIRMED')
        .map(r => r.eventId)
    );

    const candidates = events.filter(e => 
      (e.status === 'PUBLISHED' || e.status === 'APPROVED') && 
      !registeredIds.has(e._id)
    );

    // Score based on category match + tag matches
    const scored = candidates.map(event => {
      let score = 0;
      if (userInterests.includes(event.category.toLowerCase())) {
        score += 5;
      }
      event.tags.forEach(tag => {
        if (userInterests.some(i => i.includes(tag.toLowerCase()) || tag.toLowerCase().includes(i))) {
          score += 3;
        }
      });
      // Department relevance bonus
      if (event.description.toLowerCase().includes(currentUser.department.toLowerCase())) {
        score += 2;
      }
      return { event, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.event);
  };

  const getStudentPassportStats = (userId = currentUser._id): PassportStats => {
    const userAttended = attendance.filter(a => a.userId === userId);
    const attendedEventIds = new Set(userAttended.map(a => a.eventId));
    const attendedEvents = events.filter(e => attendedEventIds.has(e._id));

    const workshopsCount = attendedEvents.filter(e => e.category === 'Workshops').length;
    const seminarsCount = attendedEvents.filter(e => e.category === 'Seminars').length;
    const competitionsCount = attendedEvents.filter(e => e.category === 'Competitions').length;
    const culturalCount = attendedEvents.filter(e => e.category === 'Cultural').length;
    const sportsCount = attendedEvents.filter(e => e.category === 'Sports').length;
    const careerCount = attendedEvents.filter(e => e.category === 'Career').length;

    const certsCount = certificates.filter(c => c.userId === userId).length;

    // Approximate hours calculated from duration of attended events
    const totalHours = attendedEvents.reduce((acc, evt) => {
      const start = new Date(evt.startTime).getTime();
      const end = new Date(evt.endTime).getTime();
      const diffHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
      return acc + diffHours;
    }, 0);

    return {
      totalAttended: userAttended.length,
      workshopsCount,
      seminarsCount,
      competitionsCount,
      culturalCount,
      sportsCount,
      careerCount,
      certificatesEarned: certsCount,
      totalHours,
      achievements: PASSPORT_ACHIEVEMENTS,
    };
  };

  // ==========================================
  // Organizer Operations (Sections 19, 26, 27, 28, 47)
  // ==========================================
  const createEvent = (
    eventData: Omit<CampusEvent, '_id' | 'organizerId' | 'organizerName' | 'organizerEmail' | 'registrationCount' | 'createdAt' | 'updatedAt'>,
    asDraft = false
  ): ApiResponse<CampusEvent> => {
    if (!eventData.title?.trim() || !eventData.venue?.trim() || !eventData.capacity) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title, venue, and valid capacity are mandatory.' } };
    }

    const newEvent: CampusEvent = {
      ...eventData,
      _id: `evt-${Date.now()}`,
      organizerId: currentUser._id,
      organizerName: currentUser.name,
      organizerEmail: currentUser.email,
      registrationCount: 0,
      status: asDraft ? 'DRAFT' : (eventData.status || 'PENDING_REVIEW'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents(prev => [newEvent, ...prev]);
    return { success: true, data: newEvent };
  };

  const updateEvent = (eventId: string, updates: Partial<CampusEvent>): ApiResponse<CampusEvent> => {
    const existing = events.find(e => e._id === eventId);
    if (!existing) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Event not found.' } };
    }

    const updated: CampusEvent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If venue changed, trigger notifications to registered attendees
    if (updates.venue && updates.venue !== existing.venue) {
      const registeredUsers = registrations.filter(r => r.eventId === eventId && r.status === 'CONFIRMED');
      const venueNotifs: CampusNotification[] = registeredUsers.map(reg => ({
        _id: `notif-venue-${Date.now()}-${reg.userId}`,
        userId: reg.userId,
        eventId: eventId,
        type: 'VENUE_CHANGED',
        title: `Venue Updated: ${existing.title}`,
        message: `Notice: The event venue has been relocated to ${updates.venue}. Please plan accordingly.`,
        read: false,
        createdAt: new Date().toISOString(),
      }));
      setNotifications(prev => [...venueNotifs, ...prev]);
    }

    setEvents(prev => prev.map(e => e._id === eventId ? updated : e));
    return { success: true, data: updated };
  };

  // QR Attendance Verification (Section 19 & 47)
  const verifyAndCheckIn = (
    eventId: string, 
    qrToken: string, 
    method: 'qr' | 'manual' = 'qr'
  ): ScanVerificationResult => {
    const currentEvent = events.find(e => e._id === eventId);
    if (!currentEvent) {
      return { status: 'INVALID', message: 'Target event session is not active.' };
    }

    // 1. Look up registration by token
    const tokenClean = qrToken.trim();
    const reg = registrations.find(r => r.qrToken === tokenClean);

    if (!reg) {
      return { status: 'INVALID', message: 'QR pass token is unrecognized or counterfeit.' };
    }

    // 2. Check if pass is for this specific event
    if (reg.eventId !== eventId) {
      const intendedEvent = events.find(e => e._id === reg.eventId);
      return { 
        status: 'WRONG_EVENT', 
        message: `Pass mismatch! This pass was issued for "${intendedEvent?.title || 'Another Event'}", not "${currentEvent.title}".`,
        intendedEventTitle: intendedEvent?.title,
        currentEventTitle: currentEvent.title
      };
    }

    const attendee = allUsers.find(u => u._id === reg.userId) || {
      _id: reg.userId,
      name: reg.userName,
      email: reg.userEmail,
      rollNumber: reg.userRollNumber,
      department: reg.userDepartment,
      role: 'student',
      interests: [],
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      createdAt: '',
      updatedAt: '',
    };

    // 3. Duplicate check
    if (reg.checkedInAt) {
      return {
        status: 'DUPLICATE',
        message: `Attendee ${reg.userName} (${reg.userRollNumber}) was already checked in.`,
        registration: reg,
        event: currentEvent,
        attendee,
        checkedInAt: reg.checkedInAt,
      };
    }

    // 4. Valid check-in: record attendance atomically
    const nowIso = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      _id: `att-${Date.now()}`,
      eventId,
      registrationId: reg._id,
      userId: reg.userId,
      userName: reg.userName,
      userRollNumber: reg.userRollNumber,
      userDepartment: reg.userDepartment,
      checkedInAt: nowIso,
      checkedInBy: currentUser._id,
      method,
    };

    setRegistrations(prev => prev.map(r => r._id === reg._id ? { ...r, checkedInAt: nowIso } : r));
    setAttendance(prev => [newRecord, ...prev]);

    return {
      status: 'SUCCESS',
      message: `Verified: ${reg.userName} (${reg.userRollNumber}) marked present.`,
      registration: { ...reg, checkedInAt: nowIso },
      event: currentEvent,
      attendee,
    };
  };

  const sendAnnouncement = (eventId: string, title: string, message: string): ApiResponse<number> => {
    const event = events.find(e => e._id === eventId);
    if (!event) return { success: false, error: { code: 'NOT_FOUND', message: 'Event not found.' } };

    const attendees = registrations.filter(r => r.eventId === eventId && r.status === 'CONFIRMED');
    if (attendees.length === 0) {
      return { success: false, error: { code: 'NO_ATTENDEES', message: 'No registered attendees found for this event.' } };
    }

    const newNotifs: CampusNotification[] = attendees.map(reg => ({
      _id: `notif-ann-${Date.now()}-${reg.userId}`,
      userId: reg.userId,
      eventId: eventId,
      type: 'ANNOUNCEMENT',
      title: `[Announcement] ${event.title}: ${title}`,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    }));

    setNotifications(prev => [...newNotifs, ...prev]);
    return { success: true, data: attendees.length };
  };

  const issueCertificatesForEvent = (eventId: string): ApiResponse<number> => {
    const event = events.find(e => e._id === eventId);
    if (!event) return { success: false, error: { code: 'NOT_FOUND', message: 'Event not found.' } };

    // Get all verified attendees
    const verifiedAttendees = attendance.filter(a => a.eventId === eventId);
    if (verifiedAttendees.length === 0) {
      return { success: false, error: { code: 'NO_ATTENDANCE', message: 'No verified attendees found to issue certificates.' } };
    }

    // Filter out already issued
    const issuedUserIds = new Set(certificates.filter(c => c.eventId === eventId).map(c => c.userId));
    const eligibleAttendees = verifiedAttendees.filter(a => !issuedUserIds.has(a.userId));

    if (eligibleAttendees.length === 0) {
      return { success: false, error: { code: 'ALREADY_ISSUED', message: 'Certificates have already been issued to all verified attendees.' } };
    }

    const nowIso = new Date().toISOString();
    const newCerts: Certificate[] = eligibleAttendees.map(att => {
      const code = `DHSGSU-CERT-${new Date().getFullYear()}-${event._id.toUpperCase()}-${att.userRollNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      return {
        _id: `cert-${Date.now()}-${att.userId}`,
        eventId: event._id,
        eventTitle: event.title,
        userId: att.userId,
        userName: att.userName,
        userRollNumber: att.userRollNumber,
        department: att.userDepartment,
        certificateUrl: `/certificates/${code}.pdf`,
        verificationCode: code,
        issuedAt: nowIso,
        certificateType: 'PARTICIPATION',
        issueAuthorizedBy: `${currentUser.name} & Prof. S.P. Gautam (DSW)`,
      };
    });

    const certNotifs: CampusNotification[] = eligibleAttendees.map(att => ({
      _id: `notif-cert-${Date.now()}-${att.userId}`,
      userId: att.userId,
      eventId: event._id,
      type: 'CERTIFICATE_ISSUED',
      title: `Certificate Issued: ${event.title}`,
      message: `Your verified certificate for "${event.title}" is ready in your Event Passport.`,
      read: false,
      createdAt: nowIso,
    }));

    setCertificates(prev => [...newCerts, ...prev]);
    setNotifications(prev => [...certNotifs, ...prev]);

    return { success: true, data: newCerts.length };
  };

  // ==========================================
  // Admin Operations (Section 32)
  // ==========================================
  const adminModerateEvent = (eventId: string, newStatus: EventStatus): ApiResponse<CampusEvent> => {
    const existing = events.find(e => e._id === eventId);
    if (!existing) return { success: false, error: { code: 'NOT_FOUND', message: 'Event not found.' } };

    const updated: CampusEvent = {
      ...existing,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setEvents(prev => prev.map(e => e._id === eventId ? updated : e));
    return { success: true, data: updated };
  };

  const adminUpdateUserRole = (userId: string, newRole: User['role']): ApiResponse<User> => {
    const target = allUsers.find(u => u._id === userId);
    if (!target) return { success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } };

    const updated: User = {
      ...target,
      role: newRole,
      organizerStatus: newRole === 'organizer' || newRole === 'admin' ? 'VERIFIED' : 'NONE',
      updatedAt: new Date().toISOString(),
    };

    setAllUsers(prev => prev.map(u => u._id === userId ? updated : u));
    return { success: true, data: updated };
  };

  const adminReviewOrganizerRequest = (requestId: string, approve: boolean, remarks = ''): ApiResponse<OrganizerVerificationRequest> => {
    const req = organizerRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: { code: 'NOT_FOUND', message: 'Verification request not found.' } };

    const updatedReq: OrganizerVerificationRequest = {
      ...req,
      status: approve ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date().toISOString(),
      reviewRemarks: remarks || (approve ? 'Approved by Office of the Dean of Students Welfare (DSW)' : 'Rejected by Administration')
    };

    setOrganizerRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

    // Update user in allUsers
    setAllUsers(prev => prev.map(u => {
      if (u._id === req.userId || u.email.toLowerCase() === req.email.toLowerCase()) {
        return {
          ...u,
          role: 'organizer',
          organizerStatus: approve ? 'VERIFIED' : 'REJECTED',
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    }));

    // Persist organizer approval/rejection to shared PARISAR Auth API (/api/v1/auth)
    fetch('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'review-organizer',
        requestId,
        approve,
        remarks,
      }),
    }).catch(() => {});

    return { success: true, data: updatedReq };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        authToken,
        setCurrentUserId,
        loginWithCredentials,
        registerStudentAccount,
        registerOrganizerAccount,
        resubmitOrganizerVerification,
        updateUserProfile,
        logout,
        allUsers,
        events,
        venues,
        registrations,
        attendance,
        certificates,
        notifications,
        feedback,
        organizerRequests,
        adminReviewOrganizerRequest,
        registerForEvent,
        cancelRegistration,
        submitFeedback,
        updateUserInterests,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        getRecommendedEvents,
        getStudentPassportStats,
        createEvent,
        updateEvent,
        verifyAndCheckIn,
        sendAnnouncement,
        issueCertificatesForEvent,
        adminModerateEvent,
        adminUpdateUserRole,
        resetPrototypeData,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
