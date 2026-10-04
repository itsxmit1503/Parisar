# PARISAR (परिसर) — Judge Defense & Technical Viva Q&A Report

**Project:** PARISAR — Dedicated Campus Event Management Platform  
**Institution:** Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar, Madhya Pradesh (Central University, Est. 1946)

---

## 1. Attendance Architecture Defense

### Q1: Why didn't you use QR attendance?
> **Answer:**  
> "For offline university events, organizer roster marking by student name and roll number is faster, avoids camera/device failures, prevents screenshot sharing, and reflects how university events actually operate at DHSGSU. For online events, PARISAR uses authenticated join-and-duration tracking (`AttendanceSession`), ensuring students participate for the required duration (e.g., 80%) before certificates are unlocked."

### Q2: How do you prevent an organizer from arbitrarily altering attendance records days after an event has ended?
> **Answer:**  
> PARISAR enforces a strict **3-state Attendance Session Lifecycle** (`NOT_STARTED` → `OPEN` → `FINALIZED`):
> 1. During the event, the organizer opens attendance (`OPEN`) and marks registered students `Present` or `Absent` via the searchable roster.
> 2. When the event concludes, the organizer clicks **Close Attendance**, which triggers a mandatory confirmation modal:  
>    *"Attendance will be finalized for this event. Normal organizer edits will no longer be allowed."*
> 3. Once confirmed, the event's attendance status transitions to `FINALIZED` (`isFinalized: true`), locking all organizer attendance controls (`markRosterAttendance`, `markAllRosterPresent`, `resetRosterAttendance`).
> 4. If a legitimate post-event correction is ever required, **only a University Administrator** (`role === 'admin'`) can perform an override from `/admin/attendance`, and every override writes an immutable `ATTENDANCE_ADMIN_OVERRIDE` record to the University Audit Log.

### Q3: How does online event attendance work, and how do you stop students from clicking "Join" for 5 seconds just to get a certificate?
> **Answer:**  
> For `ONLINE` and `HYBRID` events, students see a `[ JOIN EVENT ]` action inside the Event Detail view while the session is active.
> - Clicking `[ JOIN EVENT ]` creates/updates an `AttendanceSession` record (`joinedAt`, `leftAt`, `verifiedDuration`, `participationPercent`) via `/api/v1/attendance`.
> - Each event defines a minimum participation threshold (`minParticipationPercent`, defaulting to **80%** of total event duration).
> - Certificate issuance (`issueCertificate`) checks `verifiedDuration >= requiredDuration` (`participationPercent >= minParticipationPercent`). A student who joins briefly and leaves below the threshold is marked `PARTIAL` and cannot generate a certificate.

### Q4: If QR codes are not used for attendance, what does the Student "Event Pass" represent?
> **Answer:**  
> The Student Event Pass is a clean **Digital Registration Card** (`EventPassModal.tsx`). It displays verified institutional details—Student Name, Roll Number, Department, Event Title, Date & Time, Campus Venue, Organizer, Registration Status (`CONFIRMED` / `ATTENDED`), and unique Registration ID (`REG-...`)—without any fake or redundant QR code. Students can present this card at venue entry while organizers mark their roll number in the live roster.

---

## 2. Student Identity & Profile Customization Defense

### Q5: Why do default student accounts show two-letter initials instead of profile photos?
> **Answer:**  
> Real university platforms never assign random stock photos or AI-generated faces to student records. PARISAR uses a **Deterministic Initials Avatar (`UserAvatar.tsx`)** that computes initials from the user's official name (e.g., `Amit Sharma` → `AS`, `Dr. Alok Sahay` → `AS`) with a consistent institutional color palette. A photo is displayed **only** when the user explicitly uploads or captures their own profile picture.

### Q6: How is profile image upload and cropping handled?
> **Answer:**  
> Inside Student Profile (`ProfileView.tsx`) and Organizer/Admin Profile (`RoleProfileView.tsx`), users can:
> 1. Select an image (`JPEG`, `PNG`, or `WebP` up to `2.5 MB`, minimum `64×64` px) or take a photo with their device camera.
> 2. Use the built-in **HTML5 Canvas Square Crop & Zoom Studio** to center-crop the photo to a standardized `320×320` data URI.
> 3. Save, replace, or remove the photo at any time (removing immediately restores the deterministic initials avatar).
> 4. Updates propagate immediately across the top Navbar, Profile page, Event Passport, Participant Lists, and Admin User Directory, and persist via `PATCH /api/v1/users/[id]`.

### Q7: Can a student change their Roll Number or University Email from the Profile Settings?
> **Answer:**  
> **No.** Institutional identity fields—**Full Name**, **Roll Number / University ID**, **University Email**, and **Role**—are strictly read-only in the student profile and marked with an official notice:  
> *"Verified by University Records — Contact University Administration to update."*  
> Students can only edit personal customization fields (Profile Photo, Phone Number, Bio/About, Academic Interests, Skills/Clubs, Year/Semester, and Notification Preferences).

---

## 3. Admin Access & Role Security Defense

### Q8: How is University Administrator access protected from public users?
> **Answer:**  
> 1. **No Public Admin Registration:** Public signup (`/register`) only allows `Student` registration or `Organizer` application (`organizerStatus: 'PENDING'`). The backend (`POST /api/v1/auth`) explicitly rejects any attempt to self-assign `role: 'admin'`.
> 2. **Dedicated `/admin/login` Portal:** University Administrators authenticate through `/admin/login` (**PARISAR — University Administration**, *"Authorized university administrators only."*), accessible via a subtle `"University Administration"` link in the institutional footer or direct URL.
> 3. **Zero Public Credential Leakage:** Admin passwords are never displayed on public login screens. Admin accounts are provisioned exclusively via backend environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and seeded with `bcryptjs` hashes.
> 4. **Route & API Guards:** All `/admin` and `/admin/*` pages (`/admin/events`, `/admin/organizers`, `/admin/users`, `/admin/attendance`, `/admin/certificates`, `/admin/venues`, `/admin/audit`) verify `currentUser.role === 'admin'`, and `/api/v1/admin/*` endpoints verify the signed JWT role via `requireAdmin(req)`.

---

## 4. Campus Map & Geographic Accuracy Defense

### Q9: How did you verify the coordinates of campus venues on the DHSGSU Map?
> **Answer:**  
> Instead of using a fictional diagram or generic city coordinates, PARISAR integrates the **Google Maps JavaScript API** centered directly on the **Dr. Harisingh Gour Vishwavidyalaya (Patharia Hills) campus (`23.8256, 78.7735`)**. Every venue pin uses verified geographic coordinates—including the official **Abdul Gani Khan Stadium (`23.8294032, 78.7755979`)** on Tili Road, verified against official DHSGSU documentation and Google Maps satellite imagery.
