# PARISAR (परिसर)

**Dedicated Campus Event Management & Student Participation Platform**  
*Built specifically for Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh*

> *"Your Campus. Your Events. Your Community."*  
> *"Everything happening across DHSGSU."*

---

## 📱 Official Android Application Release (APK)

The official **PARISAR Android Companion Application (v1.0.0)** is released and available for direct installation:

[![Download APK Release](https://img.shields.io/badge/Download_APK-v1.0.0_Release-B6533C?style=for-the-badge&logo=android&logoColor=white)](https://github.com/itsxmit1503/Parisar/releases/download/v1.0.0/parisar-v1.0.0-release.apk)
[![GitHub Release](https://img.shields.io/github/v/release/itsxmit1503/Parisar?style=for-the-badge&color=2F613B&label=Latest%20Release)](https://github.com/itsxmit1503/Parisar/releases/tag/v1.0.0)

- 📥 **Direct Download Link**: [**`parisar-v1.0.0-release.apk` (Latest Release Asset)**](https://github.com/itsxmit1503/Parisar/releases/download/v1.0.0/parisar-v1.0.0-release.apk)
- 📦 **GitHub Releases Page**: [**View All Releases & Assets**](https://github.com/itsxmit1503/Parisar/releases/tag/v1.0.0)
- 🗂️ **Repository File Mirror**: [`release/parisar-v1.0.0-release.apk`](./release/parisar-v1.0.0-release.apk)
- 📱 **Compatibility**: Android 9.0+ (Pie, Q, R, S, T, Upside Down Cake)
- 🏗️ **Platform Strategy**: Dual Clients (Web Portal + Native Android App), Single Centralized DHSGSU API Backend

### How to Install on Android:
1. Tap the [**Download APK link**](https://github.com/itsxmit1503/Parisar/releases/download/v1.0.0/parisar-v1.0.0-release.apk) on your smartphone.
2. When the download completes, tap **Open**.
3. If prompted by Android, enable **"Allow installation from this source"**.
4. Tap **Install** and launch **PARISAR**.

---

## 🏛️ About the Platform

**PARISAR** (परिसर — campus, premises, university environment) is an institutional platform that manages the complete lifecycle of university events. It connects students, faculty event organizers, and university administrators of **Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)** through a unified, tactile system.

### Core Problems Solved:
- **Centralized Event Lifecycle**: Eliminates fragmented Google Forms, scattered WhatsApp groups, and lost announcements.
- **Physical-Digital Event Passes**: Generates secure digital event passes with perforated aesthetics, recessed QR wells, and student roll credentials (`Y23141042`).
- **Turnstile Attendance Scanning**: High-speed optical QR code verification at venue entry with instant duplicate-scan rejection.
- **Tamper-Evident Credentials**: Issues verifiable academic certificates signed by the Dean of Students' Welfare (DSW) and Faculty Conveners.
- **Student Event Passport**: Tracks cumulative campus participation hours, departmental diversity, and milestone honors.
- **Patharia Hills Campus Wayfinding**: Interactive architectural schematic with room-level directions for landmark university halls.

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
  - **Zero Matrix / Cyberpunk Themes** (clean, scholarly, editorial typography)

---

## 🏷️ Standardized Event Categories (12 Categories)

1. **Workshop**: Practical technical studios & computing laboratories
2. **Seminar**: Memorial symposiums & national research lectures
3. **Cultural**: Bundeli folk dance, music, theatrical arts & youth festivals
4. **Competition**: Hackathons, moot courts, debates & academic tournaments
5. **Sports**: Inter-departmental leagues & stadium athletics
6. **Technology**: Emerging tech showcases, robotics & IoT exhibitions
7. **Coding**: Algorithmic sprints & software engineering competitions
8. **Entrepreneurship**: Venture incubation pitch sessions & startup bootcamps
9. **Academic**: Faculty research colloquia & departmental symposiums
10. **Club**: Astronomy night sky observations & literary societies
11. **Placement**: Campus recruitment drives, mock interviews & clinics
12. **Other**: University convocations & administrative assemblies

---

## 📍 Authentic DHSGSU Campus Venues (Patharia Hills)

- **Swarna Jayanti Auditorium**: 500-seat flagship university hall
- **Turing Advanced Computing Lab (DCSA)**: 60-seat dual-display laboratory
- **Prof. C.V. Raman Science Lecture Theatre**: 180-seat tiered science theatre
- **Gour Bhavan Senate & Conference Hall**: 120-seat wood-paneled executive chamber
- **DHSGSU Sports Complex & Stadium**: 1,200-seat stadium with synthetic track
- **Rabindranath Tagore Cultural Mandapam**: 600-seat open-air amphitheater
- **DHSGSU Innovation & Incubation Centre (IIC)**: Startup workspace & pitch studio
- **Pt. Motilal Nehru Moot Court & Law Hall**: Model courtroom with deliberation suites

---

## 🚀 Getting Started (Web Portal)

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/itsxmit1503/Parisar.git
cd Parisar

# Install dependencies
npm --prefix web install
```

### Running the Development Server
```bash
npm run dev
# The application will start at http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

---

## 👥 Interactive Testing Personas

Use the collapsible prototype toolbar at the bottom-right of the screen to switch between authentic university roles:

1. **Student**: **Amit Sharma** (B.Tech Computer Science, Roll: `Y23141042`)
   - Test event registration, digital QR pass generation, campus wayfinding, and the student passport.
2. **Faculty Organizer**: **Dr. Alok Sahay** (Faculty Convener, Dept. of Computer Science & Applications)
   - Test event creation, optical turnstile QR scanner simulation (4 test scenarios), attendee rosters, and broadcast announcements.
3. **Administrator**: **Prof. S.P. Gautam** (Dean of Students' Welfare, DSW)
   - Review university-wide metrics across all faculties, user management, event moderation queue, and immutable audit logs.

---

## 📄 License & Attribution

Designed and engineered for **Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)**, Sagar (M.P.), India.  
Central University • Established 1946.