# PARISAR (परिसर) — Judge Defense & Technical Viva Q&A Report

**Project:** PARISAR — Dedicated Campus Event Management Platform  
**Institution:** Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh (Central University, Est. 1946)

---

## 1. Final Attendance Architecture Defense

### Q1: How does PARISAR prevent screenshot sharing and proxy attendance in offline university events?
> **Answer:**  
> PARISAR never uses static QR codes on registration passes. Instead, for **Offline Events (`OFFLINE_QR`)**:
> 1. The student opens their registered event while the Organizer's attendance session is `OPEN` and clicks **Submit Attendance**.
> 2. The backend (`POST /api/v1/attendance`, `action: 'generate-temp-qr'`) issues a **cryptographically random, one-time-usable `TemporaryAttendanceToken` valid for only 60 seconds**, bound to `eventId`, `studentId`, and `registrationId`.
> 3. Generating a new QR immediately invalidates any previous unused token for that student/event.
> 4. The Organizer scans the student's screen using the **in-app camera scanner (`html5-qrcode`)**. Once scanned—or after 60 seconds—the token is permanently consumed/expired, making screenshot forwarding useless.

### Q2: How does online event attendance work without QR codes, and how do you stop students from clicking "Join" and walking away?
> **Answer:**  
> QR codes are completely disabled for **Online Events (`ONLINE_SESSION`)**. Instead, PARISAR uses **Live 2-Minute Participation Checkpoints**:
> 1. Students click **Join Event** for initial session check-in.
> 2. During the live session, the Organizer (or session controller) triggers **Attendance Verification Checkpoints (`OnlineAttendanceCheckpoint`)**, each valid for **strictly 2 minutes (120 seconds)**.
> 3. Students see a live verification banner: *"Attendance Verification: Please confirm your participation. This verification expires in 2 minutes."* with a `2:00` countdown.
> 4. The backend validates `now >= startsAt && now <= expiresAt` and prevents duplicate submissions. Certificate eligibility is computed strictly on the server (e.g., completing at least `2 of 3` checkpoints or `>= 60%` checkpoint verification).

### Q3: How do you prevent an organizer from arbitrarily altering attendance records days after an event has ended?
> **Answer:**  
> PARISAR enforces a strict **3-state Attendance Session Lifecycle** (`NOT_STARTED` → `OPEN` → `FINALIZED`):
> 1. When the event concludes, the organizer clicks **Close & Finalize**, transitioning the event's attendance status to `FINALIZED` (`isFinalized: true`).
> 2. Once `FINALIZED`, the backend rejects all organizer check-in, QR scan, checkpoint, and roster modification requests (`403 ATTENDANCE_FINALIZED`).
> 3. If a legitimate post-event correction is ever required, **only a University Administrator with `MANAGE_ATTENDANCE` (or `SUPER_ADMIN`)** can perform a correction from `/admin/attendance`, which writes an immutable `ATTENDANCE_CORRECTED` record to the University Audit Log.

---

## 2. Two-Tier University Administration & Security Defense

### Q4: How is University Administrator access provisioned and protected from public users?
> **Answer:**  
> 1. **Three Public Roles Only (`student`, `organizer`, `admin`) — Zero Public Admin Signup:** Public registration (`/register`) only allows `Student` signup or `Organizer` application (`organizerStatus: 'PENDING'`). The backend (`POST /api/v1/auth`) rejects any public attempt to create an admin account.
> 2. **Idempotent Initial `SUPER_ADMIN` Bootstrap:** On server startup, `ensureSharedDb()` reads `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from environment variables and idempotently ensures at least one active `SUPER_ADMIN` exists with a `bcryptjs` password hash. Plaintext passwords are never stored or exposed in the UI or README.
> 3. **Server-Side Route Protection (`src/middleware.ts`) & Signed JWT Cookies:** Navigating to `/admin` or `/admin/*` without a valid `parisar_auth_token` admin session redirects at the server/edge level to `/admin/login`.
> 4. **Two-Tier Admin Hierarchy (`SUPER_ADMIN` vs `ADMIN`):**
>    - `SUPER_ADMIN` has full system access and exclusive access to **Administrator Management (`/admin/administrators`)** to create or invite delegated `ADMIN` accounts using one-time SHA-256 hashed invitation tokens (`24h` expiry).
>    - Delegated `ADMIN` accounts are checked against granular `adminPermissions` (`MANAGE_ORGANIZERS`, `MANAGE_EVENTS`, `MANAGE_USERS`, `MANAGE_ATTENDANCE`, `MANAGE_CERTIFICATES`, `MANAGE_VENUES`, `VIEW_AUDIT_LOG`, `MANAGE_SECURITY`, `MANAGE_ADMINS`) on every API call via `requireAdminPermission(req, permission)`.
> 5. **Final Super Admin Lockout Prevention:** The backend counts active `SUPER_ADMIN` users before any status or level mutation and refuses to delete, revoke, suspend, or demote the last active `SUPER_ADMIN`.

---

## 3. Student Identity & Campus Geography Defense

### Q5: Why do default student accounts show two-letter initials instead of profile photos, and can students edit their Roll Number?
> **Answer:**  
> - **Deterministic Initials Avatar (`UserAvatar.tsx`):** Real university platforms never assign random stock photos to students. PARISAR computes initials from the user's official name (`Amit Sharma` → `AS`) unless the user uploads/crops their own photo via the HTML5 Canvas `320×320` crop studio.
> - **Immutable University Identity Fields:** Full Name, Roll Number / University ID, University Email, and Role are locked in Student Settings with the notice: *"Verified by University Records — Contact University Administration to update."*

### Q6: How did you verify the coordinates of campus venues on the DHSGSU Map?
> **Answer:**  
> PARISAR integrates the **Google Maps JavaScript API** centered directly on the **Dr. Harisingh Gour Vishwavidyalaya (Patharia Hills) campus (`23.8256, 78.7735`)**. Every venue marker uses verified geographic coordinates—including the official **Abdul Gani Khan Stadium (`23.8294032, 78.7755979`)** on Tili Road, verified against official DHSGSU documentation and Google Maps satellite imagery.
