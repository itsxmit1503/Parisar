# PARISAR (परिसर)

**Dedicated Campus Event Management & Student Participation Platform**  
*Built specifically for Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh*

> *"Your Campus. Your Events. Your Community."*  
> *"Everything happening across DHSGSU."*

---

## 📱 Official Android Application Release (APK — v2.0.0)

The official **PARISAR Android Application (v2.0.0)** with Role-Based Authentication (`Student`, `Verified Organizer`, `University Administrator`) is available for direct installation:

[![Download APK Release](https://img.shields.io/badge/Download_APK-v2.0.0_Latest_Release-B6533C?style=for-the-badge&logo=android&logoColor=white)](https://github.com/itsxmit1503/Parisar/releases/latest/download/parisar-v2.0.0-release.apk)
[![GitHub Release](https://img.shields.io/github/v/release/itsxmit1503/Parisar?style=for-the-badge&color=2F613B&label=Latest%20Release)](https://github.com/itsxmit1503/Parisar/releases/latest)

- 📥 **Direct Download Link (`4.6 MB`)**: [**`parisar-v2.0.0-release.apk` (Latest Release Asset)**](https://github.com/itsxmit1503/Parisar/releases/latest/download/parisar-v2.0.0-release.apk)
- 📦 **GitHub Releases Page**: [**View Latest Release & Assets (`v2.0.0`)**](https://github.com/itsxmit1503/Parisar/releases/latest)
- 🗂️ **Repository File Mirror**: [`release/parisar-v2.0.0-release.apk`](./release/parisar-v2.0.0-release.apk)
- 📱 **Compatibility**: Android 8.0+ (Oreo, Pie, Android 10–15)
- 🏗️ **Platform Strategy**: Dual Clients (Web Portal + Native Android App), Single Centralized DHSGSU API Backend (`/api/v1`)

### How to Install on Android:
1. Tap the [**Direct Download APK (`parisar-v2.0.0-release.apk`) link**](https://github.com/itsxmit1503/Parisar/releases/latest/download/parisar-v2.0.0-release.apk) on your smartphone.
2. When the download completes, tap **Open**.
3. If prompted by Android, enable **"Allow installation from this source"**.
4. Tap **Install** and launch **PARISAR**.

---

## 🏛️ About the Platform & Role-Based Architecture (v2.0.0)

**PARISAR** (परिसर — campus, premises, university environment) is the dedicated digital campus event platform for **Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar (M.P.)**. It operates across **strictly three separated roles**:

1. **STUDENT (`/student`)**:
   - Discover official approved Seminars, Workshops, Cultural Events, and Competitions across DHSGSU.
   - Register for events, receive cryptographic QR Digital Event Passes (`PARISAR-PASS-...`), track attendance status, and build an Academic Participation Passport.
2. **ORGANIZER (`/organizer`)**:
   - **Mandatory Verification Workflow**: Applying for an Organizer account creates a **Pending University Verification** request (`organizerStatus: 'PENDING'`). Organizers cannot create or publish events until verified by the University Administrator.
   - Once verified (`organizerStatus: 'VERIFIED'`), organizers can submit event proposals (`PENDING_REVIEW`), manage registered participants, export rosters, and operate the optical QR Attendance Scanner.
3. **UNIVERSITY ADMINISTRATOR (`/admin`)**:
   - Controlled administrative access (`Office of the Dean of Students' Welfare — DSW`).
   - Review and **Approve / Reject** Organizer Verification Requests.
   - Review and **Approve / Reject** submitted Event Proposals before they become visible to students.
   - Oversee university-wide participant directories, overall attendance ledgers, and campus venues.

---

## 🎨 Visual Identity: Modern Neo-Skeuomorphic Editorial UI

PARISAR features a distinct, modern neo-skeuomorphic editorial visual design:

- **Institutional Academic Palette**:
  - Warm Ivory Stone Canvas: `#F4F0E8`
  - Solid Off-White Cards: `#FCFAF5`
  - Recessed Inset Wells: `#EAE5DB`
  - High-Contrast Navy/Charcoal Text: `#18212B`
  - Terracotta Primary CTAs: `#B6533C`
  - Muted Brass Credentials: `#B08A4A`
  - Academic Sage Verified Checks: `#2F613B`
- **Tactile Physical Presence**:
  - Crisp, sharp geometry (`0px`–`4px` border radius)
  - Directional offset shadows (`shadow-[2px_2px_0_0_#18212B]`)
  - Physical depression feedback on button clicks (`active:translate-x-[1px] active:translate-y-[1px]`)
  - **Zero Glassmorphism** (no blurry frosted panels, no fake translucent cards)

---

## 📍 Authentic DHSGSU Campus Venues (Patharia Hills)

- **Swarna Jayanti Auditorium (Golden Jubilee Hall)**: 500-seat flagship university auditorium
- **Turing Advanced Computing Lab (DCSA)**: 60-seat dual-display laboratory
- **Prof. C.V. Raman Science Lecture Theatre**: 180-seat tiered science theatre
- **Gour Bhavan Senate & Conference Hall**: 120-seat executive chamber
- **DHSGSU Sports Complex & Stadium**: 1,200-seat stadium with synthetic track
- **Rabindranath Tagore Cultural Mandapam (Abhimanch)**: 600-seat open-air amphitheater
- **DHSGSU Innovation & Incubation Centre (IIC)**: Startup workspace & pitch studio
- **Pt. Motilal Nehru Moot Court & Law Hall**: Model courtroom with deliberation suites

---

## 🔐 Demo Credentials (Role-Based Login)

Use the `/login` page (or the Quick Demo Credentials drawer on `/login`) to sign in as any role:

| Role | Name | University ID / Email | Status |
| :--- | :--- | :--- | :--- |
| **Student** | Amit Sharma | `Y23141042` / `amit.sharma@dhsgsu.edu.in` | Active Student |
| **Verified Organizer** | Dr. Alok Sahay | `EMP-DCSA-104` / `alok.sahay@dhsgsu.edu.in` | Verified Faculty Convener |
| **Pending Organizer** | Priya Patel | `Y23122018` / `priya.patel@dhsgsu.edu.in` | Verification Pending |
| **Rejected Organizer** | Rohan Mehra | `Y23141088` / `rohan.mehra@dhsgsu.edu.in` | Verification Rejected |
| **University Admin** | Prof. S.P. Gautam | `ADMIN-DSW-001` / `dsw@dhsgsu.edu.in` | Dean of Students' Welfare |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/itsxmit1503/Parisar.git
cd Parisar

# Install frontend dependencies & run dev server
npm install
npm run dev

# Run REST API Backend Server (Port 10000)
cd server
npm install
npm start
```

---

## 📄 License & Attribution

Designed and engineered for **Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)**, Sagar (M.P.), India.  
Central University • Established 1946.