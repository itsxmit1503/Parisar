# PARISAR (परिसर) — Final Feature Matrix & System Verification

**Institution:** Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh  
**Tagline:** *"Your Campus. Your Events. Your Community."*  
**Version:** 3.0.0 (Final Submission Release)

---

## 1. Executive Architecture Summary

| Architectural Layer | Implementation Status | Technology & Verification |
| :--- | :--- | :--- |
| **Web Application** | **100% Complete** | Next.js 16 (App Router), React 19, TypeScript, Neo-Skeuomorphic Editorial UI |
| **Android Mobile Application** | **100% Complete** | Native Java Android WebView Wrapper (`in.edu.dhsgsu.parisar`) + WebRTC Camera & Location Permissions |
| **REST API Backend (`/api/v1/*`)** | **100% Complete** | Versioned Route Handlers (`auth`, `events`, `registrations`, `attendance`, `certificates`, `venues`, `notifications`, `users`, `devices`, `organizers`, `admin`, `audit`) |
| **Database & Persistence** | **100% Complete** | Mongoose / MongoDB Models (`src/models/index.ts`) + Automatic In-Memory Shared Store Fallback (`src/lib/serverStore.ts`) |
| **Authentication & Security** | **100% Complete** | `bcryptjs` Password Hashing, `jsonwebtoken` (JWT) Bearer + `HttpOnly` Cookie Auth, Edge Middleware (`src/middleware.ts`), Two-Tier Admin Governance (`SUPER_ADMIN` / `ADMIN`) |
| **Campus Geography (DHSGSU)** | **100% Complete** | Google Maps JavaScript API centered on Patharia Hills (`23.8256, 78.7735`) + Verified **Abdul Gani Khan Stadium** (`23.8294032, 78.7755979`) |

---

## 2. Final Two-Mode Attendance Architecture Matrix

PARISAR implements a **strict, anti-proxy, mode-specific attendance architecture** tailored separately for Offline/Physical events and Online/Virtual events:

| Attendance Dimension | Physical / Offline Events (`OFFLINE_QR`) | Online / Virtual Events (`ONLINE_SESSION`) |
| :--- | :--- | :--- |
| **Primary Mechanism** | **Student 60-Second Dynamic QR + Organizer In-App Scanner** | **Authenticated `[ JOIN EVENT ]` + 2-Minute Live Verification Checkpoints** |
| **How Attendance Works** | Student opens registered event → clicks `Submit Attendance` → Backend issues a **60-second, one-time-usable, event-specific, student-specific token** (`TemporaryAttendanceToken`) rendered as a dynamic QR code → Organizer scans via **Open Scanner** (`html5-qrcode`) | **No QR used.** Student clicks `Join Event` for initial check-in → Server triggers random **2-minute (120-second) attendance verification checkpoints** (`OnlineAttendanceCheckpoint`) → Student confirms prompt within 2 minutes |
| **8-Rule Server Validation** | 1. Token exists 2. Matches event (`WRONG_EVENT`) 3. Student registered (`NOT_REGISTERED`) 4. Session is `OPEN` 5. Not expired (`EXPIRED`, >60s) 6. Not already used 7. Not already present (`ALREADY_PRESENT`) 8. Organizer owns event / Admin authorized | 1. Student registered 2. Session `OPEN` 3. Checkpoint active 4. Within strict **120-second** window (`now <= expiresAt`) 5. Not already completed by student 6. Server calculates `completedCheckpoints / totalCheckpoints` (e.g., `2 of 3` required) |
| **Finalization & Lock** | Organizer clicks `Close Attendance` → status becomes `FINALIZED` (`isFinalized: true`), locking normal organizer edits and disabling QR generation/scanning | Closing attendance finalizes checkpoint verification and locks normal organizer edits |
| **University Admin Correction** | **Supported & Audited** — Only `SUPER_ADMIN` or `ADMIN` with `MANAGE_ATTENDANCE` can correct finalized attendance, logging an immutable `ATTENDANCE_CORRECTED` audit entry | **Supported & Audited** via Admin Attendance Ledger |

---

## 3. Complete 3-Panel Role Feature Matrix

### Panel A: Student Panel (`/student`)

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Event Discovery & Filtering** | ✅ Complete | Search by title/tags, filter by category (`Academic`, `Workshop`, `Cultural`, `Sports`, etc.), mode (`OFFLINE`, `ONLINE`, `HYBRID`), and department |
| **One-Click Event Registration** | ✅ Complete | Enforces capacity limits, registration deadlines, and duplicate prevention; issues a unique Registration ID |
| **Offline 60-Second Dynamic Attendance QR** | ✅ Complete | Inside `EventPassModal.tsx` and `EventDetailModal.tsx`, students generate a temporary 60-second QR code (`TemporaryAttendanceToken`) with live countdown and one-click regeneration when attendance is `OPEN` |
| **Online 2-Minute Checkpoint Verification** | ✅ Complete | Inside `EventDetailModal.tsx`, online participants see *"Attendance Verification: Please confirm your participation. This verification expires in 2 minutes."* with a live `2:00` countdown and progress indicator (`Checkpoints Verified: X / Y`) |
| **Verified Certificates & PDF/Print** | ✅ Complete | Downloadable/printable official DHSGSU certificates (`DHSGSU-YYYY-XXXXXX`) unlocked only after verified server-side attendance eligibility |
| **Academic Event Passport** | ✅ Complete | Cumulative ledger of attended events, workshops completed, participation hours, and earned credentials |
| **Deterministic Initials Avatar** | ✅ Complete | Zero random stock/AI human photos. Displays deterministic initials (`Amit Sharma` → `AS`) via `UserAvatar.tsx` unless the student uploads a custom photo |
| **Profile Photo Upload & Crop** | ✅ Complete | Upload file (`JPEG`/`PNG`/`WebP`, max `2.5MB`, min `64×64`) or capture via camera, interactive HTML5 Canvas `320×320` square center-crop, preview, save, change, or remove photo |
| **5-Section Student Settings** | ✅ Complete | **1. PROFILE** (editable fields + locked University-verified fields), **2. ACCOUNT** (Password, Device Management, Active Sessions, Logout), **3. PREFERENCES** (`en`/`hi` language, notifications), **4. PRIVACY**, **5. SUPPORT** |

---

### Panel B: Organizer Panel (`/organizer`)

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Mandatory Organizer Verification** | ✅ Complete | New organizer signups enter `organizerStatus: 'PENDING'` and are blocked from creating or publishing events until approved by an authorized University Administrator |
| **Create & Submit Event Proposals** | ✅ Complete | Full event creation form supporting `OFFLINE`, `ONLINE`, and `HYBRID` modes, authentic DHSGSU venues, capacity, certificate threshold (`minParticipationPercent`), and submission to DSW (`PENDING_REVIEW`) |
| **In-App QR Attendance Scanner (`OFFLINE_QR`)** | ✅ Complete | `QRScannerView.tsx` embeds an in-app camera scanner (`html5-qrcode`) that validates student 60-second QR tokens against `/api/v1/attendance` and displays exact status feedback (`Attendance marked successfully.`, `Attendance already recorded.`, `QR expired...`, etc.) + recent check-ins list |
| **Online Checkpoint Trigger (`ONLINE_SESSION`)** | ✅ Complete | Organizers can trigger live **2-minute (120-second) Attendance Verification Checkpoints** for online events and monitor active countdowns |
| **Roster Management & CSV Export** | ✅ Complete | Searchable table of registered students with Roll Number, Department, Attendance Status, manual roster controls while `OPEN`, and CSV Roster Export |
| **Targeted Event Announcements & Certificates** | ✅ Complete | Dispatch real-time notifications to registered participants and issue batch verifiable certificates |

---

### Panel C: University Administrator Panel (`/admin` & `/admin/*`)

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Dedicated `/admin/login` Portal & Edge Guard** | ✅ Complete | Displays **PARISAR — University Administration** (*"Authorized university administrators only."*). Protected by Next.js Edge Middleware (`src/middleware.ts`), anti-enumeration Forgot Password, and One-Time Admin Invitation Activation |
| **Two-Tier Admin Governance (`SUPER_ADMIN` & `ADMIN`)** | ✅ Complete | `SUPER_ADMIN` holds full institutional control; delegated `ADMIN` accounts enforce granular permissions (`MANAGE_ORGANIZERS`, `MANAGE_EVENTS`, `MANAGE_USERS`, `MANAGE_ATTENDANCE`, `MANAGE_CERTIFICATES`, `MANAGE_VENUES`, `VIEW_AUDIT_LOG`, `MANAGE_SECURITY`, `MANAGE_ADMINS`) |
| **Administrator Management (`/admin/administrators`)** | ✅ Complete | `SUPER_ADMIN` can view all administrators, create or invite new administrators with one-time SHA-256 hashed tokens (`24h` expiry), edit permissions, and suspend/revoke/restore admin access |
| **Final Super Admin Protection** | ✅ Complete | Backend enforces that the last active `SUPER_ADMIN` can never be deleted, revoked, suspended, or demoted |
| **Organizer & Event Moderation Queues** | ✅ Complete | Review pending organizer applications (`/admin/organizers`) and event proposals (`/admin/events`) with official remarks |
| **Audited Attendance Correction (`/admin/attendance`)** | ✅ Complete | Authorized admins (`MANAGE_ATTENDANCE` / `SUPER_ADMIN`) can correct finalized attendance records, recording `ATTENDANCE_CORRECTED` in the audit trail |
| **Immutable Audit Trail (`/admin/audit`)** | ✅ Complete | Timestamped log of `ADMIN_LOGIN`, `ADMIN_CREATED`, `ADMIN_INVITED`, `ADMIN_PERMISSIONS_UPDATED`, `ADMIN_SUSPENDED`, `ADMIN_REVOKED`, `ORGANIZER_APPROVED`, `EVENT_APPROVED`, `ATTENDANCE_FINALIZED`, `ATTENDANCE_CORRECTED`, and `CERTIFICATE_ISSUED` |
