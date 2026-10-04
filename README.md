# PARISAR (परिसर)

**Dedicated Campus Event Management & Student Participation Platform**  
*Built specifically for Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh*

> *"Your Campus. Your Events. Your Community."*  
> *"Everything happening across DHSGSU."*

---

## 📱 Official Android Application & Web Platform (v3.0.0)

The **PARISAR Platform (v3.0.0)** provides a unified Web Application and Android Mobile Application connected to a shared REST API backend (`/api/v1/*`) with role-based workflows for **Students**, **Verified Organizers**, and **University Administrators**:

[![Download APK Release](https://img.shields.io/badge/Download_APK-v2.0.0_Latest_Release-B6533C?style=for-the-badge&logo=android&logoColor=white)](https://github.com/itsxmit1503/Parisar/releases/latest/download/parisar-v2.0.0-release.apk)
[![GitHub Release](https://img.shields.io/github/v/release/itsxmit1503/Parisar?style=for-the-badge&color=2F613B&label=Latest%20Release)](https://github.com/itsxmit1503/Parisar/releases/latest)

- 📥 **Direct Download Link**: [**`parisar-v2.0.0-release.apk` (Latest Release Asset)**](https://github.com/itsxmit1503/Parisar/releases/latest/download/parisar-v2.0.0-release.apk)
- 🗂️ **Repository APK Mirror**: [`release/parisar-v2.0.0-release.apk`](./release/parisar-v2.0.0-release.apk)
- 📱 **Compatibility**: Android 8.0+ (Oreo, Pie, Android 10–15)
- 🏗️ **Platform Strategy**: Dual Clients (Next.js Web Portal + Android App), Shared Centralized DHSGSU API Backend (`/api/v1/*`) with MongoDB + In-Memory Store Persistence

---

## 🏛️ Three-Panel Role & Permission Architecture

**PARISAR** (परिसर — campus, premises, university environment) operates across **three strictly separated roles** (`STUDENT`, `ORGANIZER`, `ADMIN`) with internal two-tier administrative governance (`SUPER_ADMIN` and delegated `ADMIN`):

1. **STUDENT (`/student`)**:
   - Discover approved Seminars, Workshops, Cultural Events, and Sports meets across DHSGSU.
   - Register with one click and receive a digital registration pass.
   - **Offline Event Attendance (`OFFLINE_QR`)**: When the Organizer opens attendance, click **Submit Attendance** to generate a **short-lived (~60-second), one-time-usable, event-specific dynamic QR token** for the Organizer's in-app camera scanner.
   - **Online Event Attendance (`ONLINE_SESSION`)**: Click **Join Event** for initial check-in and respond to **2-minute (120-second) live participation verification checkpoints** triggered during the session to earn certificate eligibility.
   - Customize their **Student Profile** (upload/crop profile photo with HTML5 Canvas or use the deterministic initials avatar `AS`, manage 5 structured settings tabs: `PROFILE`, `ACCOUNT`, `PREFERENCES`, `PRIVACY`, `SUPPORT`).
   - Download verified **DHSGSU Certificates** (`DHSGSU-YYYY-XXXXXX`) and track cumulative participation in the **Event Passport**.

2. **ORGANIZER (`/organizer`)**:
   - **Mandatory Verification Workflow**: Applying for an Organizer account creates a **Pending University Verification** request (`organizerStatus: 'PENDING'`). Organizers cannot create or publish events until approved by the University Administrator.
   - **Offline Event Attendance (`OFFLINE_QR`)**: Open an event → click **Start Attendance** (`OPEN`) → click **Open Scanner** to launch the in-app camera QR scanner (`html5-qrcode` / Android WebRTC camera) and scan students' 60-second temporary attendance QR tokens, or use the manual roster override → click **Close & Finalize** to lock attendance (`FINALIZED`).
   - **Online Event Attendance (`ONLINE_SESSION`)**: Trigger **2-minute live attendance verification checkpoints** during online sessions and monitor student checkpoint completion (`2 of 3` checkpoints required).
   - Manage participant rosters, export CSV reports, send targeted event announcements, and issue batch certificates.

3. **UNIVERSITY ADMINISTRATOR (`/admin` & `/admin/login`)**:
   - **Controlled Administrative Access**: Accessible exclusively via `/admin/login` (**PARISAR — University Administration**) with edge/server-side route protection (`src/middleware.ts`). Public users cannot self-register as administrators.
   - **Two-Tier Admin Governance (`SUPER_ADMIN` & `ADMIN`)**:
     - `SUPER_ADMIN` (Office of the Dean of Student Welfare / Chief Admin) holds full institutional authority, including **Administrator Management (`/admin/administrators`)** to create, invite (via one-time SHA-256 hashed invitation tokens), suspend, revoke, or delegate granular permissions (`MANAGE_ORGANIZERS`, `MANAGE_EVENTS`, `MANAGE_USERS`, `MANAGE_ATTENDANCE`, `MANAGE_CERTIFICATES`, `MANAGE_VENUES`, `VIEW_AUDIT_LOG`, `MANAGE_SECURITY`, `MANAGE_ADMINS`).
     - The final active `SUPER_ADMIN` is protected at the backend API level and can never be deleted, revoked, suspended, or demoted.
   - Review and **Approve / Reject** Organizer Verification Requests (`/admin/organizers`) and Event Proposals (`/admin/events`).
   - Perform **Audited Attendance Corrections** (`/admin/attendance`) on finalized events, recording immutable `ATTENDANCE_CORRECTED` entries in `/admin/audit`.

---

## 📍 Verified DHSGSU Campus Map (Google Maps JS API)

Centered on **Dr. Harisingh Gour Vishwavidyalaya, Patharia Hills, Sagar (`23.8256, 78.7735`)** with verified campus coordinates:
- **Swarna Jayanti Auditorium (Golden Jubilee Hall)** — `23.82612, 78.77284`
- **Department of Computer Science & Applications (DCSA)** — `23.82485, 78.77412`
- **Abdul Gani Khan Stadium (University Sports Ground, Tili Road)** — `23.8294032, 78.7755979`
- **Gour Bhavan (Administrative Block)** — `23.82590, 78.77360`
- **Jawaharlal Nehru Central Library** — `23.82530, 78.77295`
- **Rabindranath Tagore Open Air Theatre (Abhimanch)** — `23.82645, 78.77450`

---

## 🔐 Evaluator & Demo Credentials

### 1. Student & Organizer Login (`/login`)
| Role | Name | University ID / Email | Demo Password | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Amit Sharma | `Y23141042` / `amit.sharma@dhsgsu.edu.in` | `student123` | Active Student |
| **Verified Organizer** | Dr. Alok Sahay | `EMP-DCSA-104` / `alok.sahay@dhsgsu.edu.in` | `organizer123` | Verified Faculty Convener |
| **Pending Organizer** | Priya Patel | `Y23122018` / `priya.patel@dhsgsu.edu.in` | `organizer123` | Verification Pending |
| **Rejected Organizer** | Rohan Mehra | `Y23141088` / `rohan.mehra@dhsgsu.edu.in` | `organizer123` | Verification Rejected |

### 2. Controlled University Administrator Bootstrap (`/admin/login`)
Public administrator registration is disabled, and production administrator passwords are never exposed in public UI or repository documentation.
- **Portal URL**: `/admin/login`
- **Environment Bootstrap**: Configure `SUPER_ADMIN_EMAIL` (default `dsw@dhsgsu.edu.in`) and `SUPER_ADMIN_PASSWORD` in `.env.local` (see [`.env.example`](./.env.example)). On server startup, PARISAR idempotently ensures the initial `SUPER_ADMIN` account exists with a bcrypt-hashed password.
- **Additional Administrators**: Created or invited exclusively by a `SUPER_ADMIN` via **Administrator Management (`/admin/administrators`)** using one-time invitation tokens.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/itsxmit1503/Parisar.git
cd Parisar

# Copy environment template and configure secrets
cp .env.example .env.local

# Install dependencies & start development server
npm install
npm run dev

# Production build verification
npm run build
```

---

## 📄 Documentation & Judge Defense Reports
- [**Final Feature Matrix (`PARISAR_FINAL_FEATURE_MATRIX.md`)**](./PARISAR_FINAL_FEATURE_MATRIX.md)
- [**Judge Defense & Viva Q&A (`PARISAR_JUDGE_DEFENSE_QA.md`)**](./PARISAR_JUDGE_DEFENSE_QA.md)

---

## 📄 License & Attribution
Designed and engineered for **Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)**, Sagar (M.P.), India.  
Central University • Established 1946.