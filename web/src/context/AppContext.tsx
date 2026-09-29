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
  EventStatus
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
  PASSPORT_ACHIEVEMENTS
} from '../lib/mockData';

interface AppContextType {
  // Current session
  currentUser: User;
  setCurrentUserId: (id: string) => void;
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
  adminModerateEvent: (eventId: string, newStatus: EventStatus) => ApiResponse<CampusEvent>;
  adminUpdateUserRole: (userId: string, newRole: User['role']) => ApiResponse<User>;
  
  // Prototype controls
  resetPrototypeData: () => void;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'parisar_dhsgsu_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [currentUserId, setCurrentUserIdState] = useState<string>('student-1');
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);
  const [venues] = useState<CampusVenue[]>(CAMPUS_VENUES);
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [notifications, setNotifications] = useState<CampusNotification[]>(INITIAL_NOTIFICATIONS);
  const [feedback, setFeedback] = useState<EventFeedback[]>(INITIAL_FEEDBACK);

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(`${STORAGE_PREFIX}users`);
      if (storedUsers) setAllUsers(JSON.parse(storedUsers));

      const storedEvents = localStorage.getItem(`${STORAGE_PREFIX}events`);
      if (storedEvents) setEvents(JSON.parse(storedEvents));

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

      const storedUser = localStorage.getItem(`${STORAGE_PREFIX}currentUserId`);
      if (storedUser) setCurrentUserIdState(storedUser);
    } catch {
      // Fallback to initial mock if error reading
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when collections change
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
      localStorage.setItem(`${STORAGE_PREFIX}currentUserId`, currentUserId);
    } catch (e) {
      console.warn('Storage quota or persistence warning:', e);
    }
  }, [isLoaded, allUsers, events, registrations, attendance, certificates, notifications, feedback, currentUserId]);

  const currentUser = allUsers.find(u => u._id === currentUserId) || allUsers[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
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
      localStorage.removeItem(`${STORAGE_PREFIX}currentUserId`);
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
    setCurrentUserIdState('student-1');
  };

  // ==========================================
  // Student Operations (Sections 16, 17, 18, 45, 46)
  // ==========================================
  const registerForEvent = (eventId: string): ApiResponse<Registration> => {
    const targetEvent = events.find(e => e._id === eventId);
    if (!targetEvent) {
      return { success: false, error: { code: 'EVENT_NOT_FOUND', message: 'Requested event could not be found.' } };
    }

    if (targetEvent.status !== 'PUBLISHED') {
      return { success: false, error: { code: 'EVENT_NOT_OPEN', message: 'Registration is not currently open for this event.' } };
    }

    const now = new Date();
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
    const qrToken = `CP-PASS-${codeCategory}-${cleanRoll}-${randomSalt}`;

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
      message: `Your verified digital pass has been generated. View your pass in 'My Passes' to check in at ${targetEvent.venue}.`,
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
      e.status === 'PUBLISHED' && 
      !registeredIds.has(e._id) &&
      new Date(e.registrationDeadline) >= new Date()
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
      status: asDraft ? 'DRAFT' : 'PUBLISHED',
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
      const code = `CP-CERT-${new Date().getFullYear()}-${event._id.toUpperCase()}-${att.userRollNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      return {
        _id: `cert-${Date.now()}-${att.userId}`,
        eventId: event._id,
        eventTitle: event.title,
        userId: att.userId,
        userName: att.userName,
        userRollNumber: att.userRollNumber,
        department: att.userDepartment,
        certificateUrl: `https://campus.edu/verify/cert/${code}`,
        verificationCode: code,
        issuedAt: nowIso,
        certificateType: 'PARTICIPATION',
        issueAuthorizedBy: `${currentUser.name} & Dean Arthur Vance`,
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
      updatedAt: new Date().toISOString(),
    };

    setAllUsers(prev => prev.map(u => u._id === userId ? updated : u));
    return { success: true, data: updated };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUserId,
        allUsers,
        events,
        venues,
        registrations,
        attendance,
        certificates,
        notifications,
        feedback,
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
