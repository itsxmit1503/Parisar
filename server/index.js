// ==============================================================================
// PARISAR REST API Backend Server (v2.0 — Role-Based Auth & Approval Workflows)
// Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh
// ==============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {
  USERS,
  ORGANIZER_REQUESTS,
  VENUES,
  EVENTS,
  REGISTRATIONS,
  ATTENDANCE,
  CERTIFICATES,
  ACHIEVEMENTS
} = require('./data/dhsgsuData');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'parisar_dhsgsu_jwt_secret_2026';

// Middleware
app.use(cors({
  origin: '*', // Allow Web portal & Mobile APK clients
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-Memory Data Store (Initialized with authentic DHSGSU data)
let dbUsers = [...USERS];
let dbOrganizerRequests = [...ORGANIZER_REQUESTS];
let dbVenues = [...VENUES];
let dbEvents = [...EVENTS];
let dbRegistrations = [...REGISTRATIONS];
let dbAttendance = [...ATTENDANCE];
let dbCertificates = [...CERTIFICATES];
let dbNotifications = [];

// MongoDB Atlas Connection (Optional / Progressive Enhancement)
let isMongoConnected = false;
if (process.env.MONGODB_URI) {
  console.log('Connecting to MongoDB Atlas...');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('Connected successfully to MongoDB Atlas (parisar_dhsgsu)');
    })
    .catch(err => {
      console.warn('MongoDB connection failed, falling back to persistent in-memory store:', err.message);
    });
} else {
  console.log('No MONGODB_URI provided. Running on DHSGSU in-memory dataset.');
}

// ------------------------------------------------------------------------------
// Root & Health Check Endpoints (for Render Health Checks)
// ------------------------------------------------------------------------------
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    service: 'PARISAR REST API',
    institution: 'Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar (M.P.)',
    version: '2.0.0',
    architecture: 'Role-Based Auth (Student / Verified Organizer / University Administrator)',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MONGODB_ATLAS' : 'IN_MEMORY_DHSGSU_STORE',
    endpoints: {
      login: '/api/v1/auth/login',
      registerStudent: '/api/v1/auth/register-student',
      registerOrganizer: '/api/v1/auth/register-organizer',
      organizerRequests: '/api/v1/organizer-requests',
      events: '/api/v1/events',
      venues: '/api/v1/venues',
      registrations: '/api/v1/registrations',
      attendance: '/api/v1/attendance',
      announcements: '/api/v1/announcements',
      certificates: '/api/v1/certificates',
      passport: '/api/v1/passport'
    }
  });
});

// ------------------------------------------------------------------------------
// Authentication & Account Creation Routes (/api/v1/auth)
// ------------------------------------------------------------------------------
app.post('/api/v1/auth/login', (req, res) => {
  const { identifier, email, rollNumber, password, userId, adminOnly } = req.body;
  const query = (identifier || email || rollNumber || '').trim().toLowerCase();

  let user = null;
  if (query) {
    user = dbUsers.find(
      u =>
        u.email.toLowerCase() === query ||
        (u.rollNumber && u.rollNumber.toLowerCase() === query) ||
        u._id.toLowerCase() === query
    );
  } else if (userId) {
    user = dbUsers.find(u => u._id === userId);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found. Check your email or roll number.'
      },
      message: 'Account not found. Check your email or roll number.'
    });
  }

  if (user.passwordHash && password !== undefined && user.passwordHash !== String(password)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INCORRECT_PASSWORD',
        message: 'Incorrect password.'
      },
      message: 'Incorrect password.'
    });
  }

  if (adminOnly && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_ADMIN',
        message: 'Your account is currently unavailable.'
      },
      message: 'Your account is currently unavailable.'
    });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role, organizerStatus: user.organizerStatus, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    data: {
      token,
      user
    }
  });
});

// Student Signup (Section 6: Student -> Student Panel)
app.post('/api/v1/auth/register-student', (req, res) => {
  const { name, rollNumber, email, department, semester, phone, password } = req.body;
  if (!name || !rollNumber || !email) {
    return res.status(400).json({
      success: false,
      message: 'Full Name, University ID / Roll Number, and Email are required.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRoll = rollNumber.trim().toUpperCase();

  const existingIndex = dbUsers.findIndex(
    u =>
      u.email.toLowerCase() === cleanEmail ||
      (u.rollNumber && u.rollNumber.toUpperCase() === cleanRoll)
  );

  if (existingIndex !== -1) {
    const updatedUser = {
      ...dbUsers[existingIndex],
      name: name.trim(),
      email: cleanEmail,
      rollNumber: cleanRoll,
      department: department || dbUsers[existingIndex].department,
      semester: Number(semester) || dbUsers[existingIndex].semester || 6,
      passwordHash: password ? String(password) : dbUsers[existingIndex].passwordHash,
      updatedAt: new Date().toISOString()
    };
    dbUsers[existingIndex] = updatedUser;
    const token = jwt.sign(
      { userId: updatedUser._id, role: updatedUser.role, email: updatedUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(200).json({
      success: true,
      message: 'Student account synced successfully.',
      data: { token, user: updatedUser }
    });
  }

  const newUser = {
    _id: `student-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    rollNumber: cleanRoll,
    department: department || 'Department of Computer Science & Applications (DCSA)',
    semester: Number(semester) || 6,
    role: 'student',
    passwordHash: password ? String(password) : undefined,
    organizerStatus: 'NONE',
    interests: ['Seminar', 'Workshop', 'Cultural', 'Coding'],
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    phone: phone || '+91 98260 00000',
    createdAt: new Date().toISOString()
  };

  dbUsers.unshift(newUser);

  const token = jwt.sign(
    { userId: newUser._id, role: newUser.role, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Student account created successfully.',
    data: { token, user: newUser }
  });
});

// Organizer Signup & Verification Request (Section 7: Organizer -> Pending University Verification)
app.post('/api/v1/auth/register-organizer', (req, res) => {
  const { name, universityId, email, department, designation, phone, reason, supportingInfo, password } = req.body;
  if (!name || !universityId || !email || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Full Name, University ID, Email, and Reason for Organizing are required.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanId = universityId.trim().toUpperCase();

  const newUserId = `org-${Date.now()}`;
  const newUser = {
    _id: newUserId,
    name: name.trim(),
    email: cleanEmail,
    rollNumber: cleanId,
    department: department || 'Department of Computer Science & Applications (DCSA)',
    designation: designation || 'Faculty / Society Coordinator',
    role: 'organizer',
    organizerStatus: 'PENDING',
    passwordHash: password ? String(password) : undefined,
    organization: department || 'DHSGSU Department Body',
    interests: ['Seminar', 'Workshop'],
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    phone: phone || '+91 94251 00000',
    createdAt: new Date().toISOString()
  };

  const newRequest = {
    id: `req-${Date.now()}`,
    userId: newUserId,
    fullName: newUser.name,
    universityId: newUser.rollNumber,
    department: newUser.department,
    designation: newUser.designation,
    email: newUser.email,
    phone: newUser.phone,
    reason: reason.trim(),
    supportingInfo: supportingInfo || 'Submitted via PARISAR Organizer Registration',
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  };

  const existingIndex = dbUsers.findIndex(
    u =>
      u.email.toLowerCase() === cleanEmail ||
      (u.rollNumber && u.rollNumber.toUpperCase() === cleanId)
  );

  if (existingIndex !== -1) {
    dbUsers[existingIndex] = {
      ...dbUsers[existingIndex],
      ...newUser,
      _id: dbUsers[existingIndex]._id
    };
  } else {
    dbUsers.unshift(newUser);
  }
  dbOrganizerRequests.unshift(newRequest);

  const token = jwt.sign(
    { userId: newUser._id, role: newUser.role, organizerStatus: newUser.organizerStatus, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Your organizer verification is still pending.',
    data: { token, user: newUser, request: newRequest }
  });
});

app.get('/api/v1/auth/users', (req, res) => {
  res.status(200).json({
    success: true,
    data: dbUsers
  });
});

// ------------------------------------------------------------------------------
// Organizer Verification Requests Routes (/api/v1/organizer-requests)
// ------------------------------------------------------------------------------
app.get('/api/v1/organizer-requests', (req, res) => {
  res.status(200).json({
    success: true,
    count: dbOrganizerRequests.length,
    data: dbOrganizerRequests
  });
});

app.post('/api/v1/organizer-requests/:id/review', (req, res) => {
  const { decision, remarks } = req.body; // decision: 'APPROVED' | 'REJECTED'
  const reqItem = dbOrganizerRequests.find(r => r.id === req.params.id);

  if (!reqItem) {
    return res.status(404).json({ success: false, message: 'Verification request not found.' });
  }

  reqItem.status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  reqItem.reviewedAt = new Date().toISOString();
  reqItem.reviewedBy = 'Prof. S.P. Gautam (DSW)';
  reqItem.remarks = remarks || (decision === 'APPROVED' ? 'Verified by University Administration.' : 'Verification declined.');

  // Update corresponding user's organizerStatus
  const user = dbUsers.find(u => u._id === reqItem.userId || u.email === reqItem.email);
  if (user) {
    user.role = 'organizer';
    user.organizerStatus = decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
  }

  res.status(200).json({
    success: true,
    message: `Organizer request ${reqItem.status.toLowerCase()}.`,
    data: { request: reqItem, user }
  });
});

// ------------------------------------------------------------------------------
// Venues Routes (/api/v1/venues)
// ------------------------------------------------------------------------------
app.get('/api/v1/venues', (req, res) => {
  res.status(200).json({
    success: true,
    data: dbVenues
  });
});

// ------------------------------------------------------------------------------
// Events & Event Approval Workflow Routes (/api/v1/events)
// ------------------------------------------------------------------------------
app.get('/api/v1/events', (req, res) => {
  const { category, status, search, venueId, publicOnly } = req.query;
  
  let results = [...dbEvents];
  
  if (publicOnly === 'true') {
    results = results.filter(e => e.status === 'PUBLISHED' || e.status === 'APPROVED');
  } else if (status && status !== 'ALL') {
    results = results.filter(e => e.status === status);
  }

  if (category && category !== 'ALL') {
    results = results.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }
  if (venueId) {
    results = results.filter(e => e.venueId === venueId);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(e => 
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

app.get('/api/v1/events/:id', (req, res) => {
  const event = dbEvents.find(e => e._id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  res.status(200).json({ success: true, data: event });
});

app.post('/api/v1/events', (req, res) => {
  // Submitted events default to PENDING_REVIEW until approved by University Administrator
  const requestedStatus = req.body.status === 'DRAFT' ? 'DRAFT' : 'PENDING_REVIEW';

  const newEvent = {
    _id: `evt-${Date.now()}`,
    title: req.body.title || 'Untitled University Event',
    description: req.body.description || 'Event organized through PARISAR • DHSGSU.',
    category: req.body.category || 'Workshop',
    organizerId: req.body.organizerId || 'org-1',
    organizerName: req.body.organizerName || 'Dr. Alok Sahay',
    organizerEmail: req.body.organizerEmail || 'alok.sahay@dhsgsu.edu.in',
    venue: req.body.venue || 'Swarna Jayanti Auditorium',
    venueId: req.body.venueId || 'venue-swarna-jayanti',
    startTime: req.body.startTime || new Date().toISOString(),
    endTime: req.body.endTime || new Date(Date.now() + 3600000 * 3).toISOString(),
    capacity: parseInt(req.body.capacity, 10) || 100,
    registrationCount: 0,
    registrationDeadline: req.body.registrationDeadline || new Date(Date.now() + 86400000).toISOString(),
    tags: req.body.tags || ['DHSGSU', 'Campus'],
    coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    status: requestedStatus,
    eligibility: req.body.eligibility || 'Open to all enrolled students of DHSGSU',
    specialInstructions: req.body.specialInstructions || 'Bring university ID card.',
    departmentScope: req.body.departmentScope || 'University Campus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbEvents.unshift(newEvent);
  res.status(201).json({
    success: true,
    message: requestedStatus === 'DRAFT'
      ? 'Event saved as draft.'
      : 'Event submitted for University Administrator review.',
    data: newEvent
  });
});

// Admin Event Moderation (Approve -> PUBLISHED, Reject -> REJECTED)
app.put('/api/v1/events/:id/status', (req, res) => {
  const { status } = req.body;
  const event = dbEvents.find(e => e._id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  event.status = status === 'APPROVED' ? 'PUBLISHED' : status;
  event.updatedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: `Event status updated to ${event.status}.`,
    data: event
  });
});

// ------------------------------------------------------------------------------
// Registrations & Digital Pass Routes (/api/v1/registrations)
// ------------------------------------------------------------------------------
app.post('/api/v1/registrations', (req, res) => {
  const { eventId, userId } = req.body;
  
  const event = dbEvents.find(e => e._id === eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.status !== 'PUBLISHED' && event.status !== 'APPROVED') {
    return res.status(400).json({
      success: false,
      message: 'Registrations are only open for approved and published university events.'
    });
  }
  
  const user = dbUsers.find(u => u._id === (userId || 'student-1')) || dbUsers[0];
  
  // Check existing registration
  const existing = dbRegistrations.find(r => r.eventId === eventId && r.userId === user._id && r.status === 'CONFIRMED');
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Already registered for this event',
      data: existing
    });
  }

  // Check capacity
  if (event.registrationCount >= event.capacity) {
    return res.status(400).json({ success: false, message: 'Event capacity reached.' });
  }

  const prefix = event.category.substring(0, 2).toUpperCase();
  const rollSuffix = user.rollNumber ? user.rollNumber.slice(-5) : '00001';
  const qrToken = `PARISAR-PASS-${prefix}-${rollSuffix}`;

  const newReg = {
    _id: `reg-${Date.now()}`,
    eventId: event._id,
    userId: user._id,
    userName: user.name,
    userRollNumber: user.rollNumber || 'N/A',
    userDepartment: user.department,
    userEmail: user.email,
    status: 'CONFIRMED',
    registeredAt: new Date().toISOString(),
    qrToken,
    checkedInAt: null,
  };

  dbRegistrations.unshift(newReg);
  event.registrationCount += 1;

  res.status(201).json({
    success: true,
    message: 'Registration confirmed. Digital pass generated.',
    data: newReg
  });
});

app.get('/api/v1/registrations/my', (req, res) => {
  const userId = req.query.userId || 'student-1';
  const myRegs = dbRegistrations.filter(r => r.userId === userId && r.status === 'CONFIRMED');
  
  const populated = myRegs.map(r => ({
    registration: r,
    event: dbEvents.find(e => e._id === r.eventId) || null
  }));

  res.status(200).json({
    success: true,
    count: populated.length,
    data: populated
  });
});

// ------------------------------------------------------------------------------
// Turnstile Optical QR Scanner Routes (/api/v1/attendance)
// ------------------------------------------------------------------------------
app.post('/api/v1/attendance/verify', (req, res) => {
  const { eventId, qrToken, method } = req.body;
  
  if (!qrToken || !eventId) {
    return res.status(400).json({
      status: 'INVALID',
      message: 'Both Event ID and QR Token are required.'
    });
  }

  // Find registration across all events by token
  const matchedReg = dbRegistrations.find(r => r.qrToken === qrToken.trim());
  
  if (!matchedReg) {
    return res.status(200).json({
      status: 'INVALID',
      message: 'Registration Not Found: Unrecognized or counterfeit QR pass token.'
    });
  }

  // Check if token belongs to another event
  if (matchedReg.eventId !== eventId) {
    const wrongEvent = dbEvents.find(e => e._id === matchedReg.eventId);
    return res.status(200).json({
      status: 'WRONG_EVENT',
      message: `Pass is valid, but issued for "${wrongEvent ? wrongEvent.title : matchedReg.eventId}", not this session.`,
      attendee: {
        name: matchedReg.userName,
        rollNumber: matchedReg.userRollNumber,
        department: matchedReg.userDepartment
      }
    });
  }

  // Check duplicate scan
  if (matchedReg.checkedInAt) {
    return res.status(200).json({
      status: 'DUPLICATE',
      message: `Attendee ${matchedReg.userName} already checked in at ${new Date(matchedReg.checkedInAt).toLocaleTimeString()}. Entrance denied.`,
      checkedInAt: matchedReg.checkedInAt,
      attendee: {
        name: matchedReg.userName,
        rollNumber: matchedReg.userRollNumber,
        department: matchedReg.userDepartment
      }
    });
  }

  // Success Check-in
  const now = new Date().toISOString();
  matchedReg.checkedInAt = now;

  const attendanceRecord = {
    _id: `att-${Date.now()}`,
    eventId,
    registrationId: matchedReg._id,
    userId: matchedReg.userId,
    userName: matchedReg.userName,
    userRollNumber: matchedReg.userRollNumber,
    userDepartment: matchedReg.userDepartment,
    checkedInAt: now,
    checkedInBy: 'org-1',
    method: method || 'qr'
  };

  dbAttendance.unshift(attendanceRecord);

  return res.status(200).json({
    status: 'SUCCESS',
    message: `Attendance verified! Welcome, ${matchedReg.userName}. Entrance granted.`,
    checkedInAt: now,
    attendee: {
      name: matchedReg.userName,
      rollNumber: matchedReg.userRollNumber,
      department: matchedReg.userDepartment
    }
  });
});

app.get('/api/v1/attendance', (req, res) => {
  res.status(200).json({
    success: true,
    count: dbAttendance.length,
    data: dbAttendance
  });
});

app.get('/api/v1/attendance/:eventId', (req, res) => {
  const records = dbAttendance.filter(a => a.eventId === req.params.eventId);
  res.status(200).json({
    success: true,
    count: records.length,
    data: records
  });
});

// ------------------------------------------------------------------------------
// Announcements Route (/api/v1/announcements)
// ------------------------------------------------------------------------------
app.post('/api/v1/announcements', (req, res) => {
  const { eventId, title, message } = req.body;
  const attendees = dbRegistrations.filter(r => r.eventId === eventId && r.status === 'CONFIRMED');

  attendees.forEach(att => {
    dbNotifications.unshift({
      _id: `notif-${Date.now()}-${att.userId}`,
      userId: att.userId,
      eventId,
      type: 'ANNOUNCEMENT',
      title: title || 'Urgent Event Notice',
      message: message || '',
      read: false,
      createdAt: new Date().toISOString()
    });
  });

  res.status(200).json({
    success: true,
    message: `Dispatched announcement to ${attendees.length} registered students.`,
    data: attendees.length
  });
});

// ------------------------------------------------------------------------------
// Certificates Route (/api/v1/certificates)
// ------------------------------------------------------------------------------
app.get('/api/v1/certificates', (req, res) => {
  const { userId } = req.query;
  let certs = [...dbCertificates];
  if (userId) {
    certs = certs.filter(c => c.userId === userId);
  }
  res.status(200).json({
    success: true,
    count: certs.length,
    data: certs
  });
});

// ------------------------------------------------------------------------------
// Student Event Passport Route (/api/v1/passport)
// ------------------------------------------------------------------------------
app.get('/api/v1/passport', (req, res) => {
  const userId = req.query.userId || 'student-1';
  const user = dbUsers.find(u => u._id === userId) || dbUsers[0];
  const myAttendance = dbAttendance.filter(a => a.userId === userId);
  const totalHours = myAttendance.length * 4;

  res.status(200).json({
    success: true,
    data: {
      user,
      totalHours,
      attendedEventsCount: myAttendance.length,
      achievements: ACHIEVEMENTS,
      timeline: myAttendance.map(att => ({
        eventTitle: dbEvents.find(e => e._id === att.eventId)?.title || 'Campus Event',
        venue: dbEvents.find(e => e._id === att.eventId)?.venue || 'Patharia Hills Campus',
        checkedInAt: att.checkedInAt
      }))
    }
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`PARISAR REST API Server v2.0 running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Institution: Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)`);
  console.log(`====================================================`);
});
