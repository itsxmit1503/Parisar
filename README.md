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

## 🏛️ Three-Panel Role Architecture

**PARISAR** (परिसर — campus, premises, university environment) operates across **three strictly separated roles**:

1. **STUDENT (`/student`)**:
   - Discover approved Seminars, Workshops, Cultural Events, and Sports meets across DHSGSU.
   - Register with one click and receive a clean **Digital Registration Card** displaying Student Name, Roll Number, Event Details, Venue, Organizer, and Registration ID.
   - Join **Online / Hybrid Events** directly via `[ JOIN EVENT ]` with automatic session duration tracking toward certificate eligibility (`≥ 80%` required duration).
   - Customize their **Student Profile** (upload/crop profile photo with HTML5 Canvas or use the deterministic initials avatar `AS`, manage 5 structured settings tabs: `PROFILE`, `ACCOUNT`, `PREFERENCES`, `PRIVACY`, `SUPPORT`).
   - Download verified **DHSGSU Certificates** (`DHSGSU-YYYY-XXXXXX`) and track cumulative participation in the **Event Passport**.

2. **ORGANIZER (`/organizer`)**:
   - **Mandatory Verification Workflow**: Applying for an Organizer account creates a **Pending University Verification** request (`organizerStatus: 'PENDING'`). Organizers cannot create or publish events until approved by the University Administrator.
   - **Roster-Based Offline Attendance Console**: Open an event → click `Start Attendance` (`OPEN`) → search registered students by Name, Roll Number, or Email → mark `Present` / `Absent` (or `Mark All Present` / `Reset`) → click `Close Attendance` to **Finalize & Lock** attendance (`FINALIZED`).
   - Manage participant rosters, export CSV reports, send targeted event announcements, and issue batch certificates.

3. **UNIVERSITY ADMINISTRATOR (`/admin` & `/admin/login`)**:
   - **Controlled Administrative Access**: Accessible via `/admin/login` (**PARISAR — University Administration**) or the subtle `"University Administration"` link in the footer. Public users cannot sign up as administrators.
   - Review and **Approve / Reject** Organizer Verification Requests (`/admin/organizers`).
   - Review and **Approve / Reject** submitted Event Proposals (`/admin/events`).
   - Perform **Audited Attendance Overrides** (`/admin/attendance`) on finalized events, recording immutable `ATTENDANCE_ADMIN_OVERRIDE` logs in `/admin/audit`.
   - Manage the University User Directory (`/admin/users`), Certificates (`/admin/certificates`), and verified DHSGSU Campus Venues (`/admin/venues`).

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
| Role | Name | University ID / Email | Default Password | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Amit Sharma | `Y23141042` / `amit.sharma@dhsgsu.edu.in` | `student123` | Active Student |
| **Verified Organizer** | Dr. Alok Sahay | `EMP-DCSA-104` / `alok.sahay@dhsgsu.edu.in` | `organizer123` | Verified Faculty Convener |
| **Pending Organizer** | Priya Patel | `Y23122018` / `priya.patel@dhsgsu.edu.in` | `organizer123` | Verification Pending |
| **Rejected Organizer** | Rohan Mehra | `Y23141088` / `rohan.mehra@dhsgsu.edu.in` | `organizer123` | Verification Rejected |

### 2. Controlled University Administrator Login (`/admin/login`)
Admin credentials are **never** displayed on public screens and Admin self-registration is disabled. Evaluators can sign in at **`/admin/login`** using the seeded institutional administrator account (configurable via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables):
- **Portal URL**: `/admin/login`
- **Admin Email / ID**: `dsw@dhsgsu.edu.in` (or `ADMIN-DSW-001`)
- **Seeded Password**: `admin123` (or `process.env.ADMIN_PASSWORD`)

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/itsxmit1503/Parisar.git
cd Parisar

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