# SAN University Student Portal: System Review & Usage Scenarios

This document provides a comprehensive overview of how each stakeholder (Admin, Faculty, and Student) interacts with the SAN University Student Portal, followed by a technical review of the system's architecture, strengths, and potential areas for future enhancement.

---

## 1. Stakeholder Usage Scenarios (The Lifecycle)

The system is designed around three primary roles. Here is the step-by-step lifecycle of how the portal is used in a real-world academic environment.

### A. The Administrator (System Setup & Operations)
*The Admin is the backbone of the system, responsible for configuring the academic environment before any student or faculty member can interact with it.*

1. **Initial Configuration:**
   - **Creating the Foundation:** The Admin logs in and sets up the active semester. They create the foundational data: adding Faculty members and creating the Course Catalog for the upcoming semester.
   - **Onboarding Students:** The Admin creates new student profiles, assigning them to specific programs, departments, and faculty advisors.
2. **Managing the Registration Period (Advising):**
   - **Opening the Gates:** Before the semester starts, the Admin creates **Advising Slots** (based on earned credits) to control server load and prioritize senior students.
   - **Monitoring:** They monitor enrollment numbers and handle any exceptions or special requests via the messaging system.
3. **Mid-Semester Operations:**
   - **Drop Periods:** The Admin configures specific timeframes (Drop Periods) during which students are allowed to drop individual courses.
   - **Semester Drops:** If a student faces a severe issue (e.g., medical), they request a full semester drop. The Admin reviews these requests in the `Drop Requests` panel, approving or rejecting them and providing feedback.
   - **Financials:** The Admin updates student payment statuses (Clear/Due) to ensure students with outstanding dues cannot participate in future advising.
4. **Day-to-Day Maintenance:**
   - **Announcements:** Broadcasting important notices to the entire university.
   - **Support:** Answering direct messages from students regarding administrative issues.
   - **Security:** Handling identity-verified password reset requests for students who have lost access to their accounts.

### B. The Faculty (Academic Management & Advising)
*Faculty members use the portal to manage their assigned classes and guide their designated advisees.*

1. **Course Management:**
   - **Viewing Rosters:** Faculty log in to see the courses they are teaching in the current semester. They can view the real-time list of enrolled students for each course.
   - **Grading:** At the end of the semester, faculty members use the portal to submit final grades (A, B, C, D, F) for their students.
2. **Student Advising:**
   - **Mentorship:** Faculty members are assigned a list of specific student advisees. They can view the complete academic profile of these students, including past grades, current CGPA, and enrolled courses, allowing them to provide informed academic guidance.

### C. The Student (The Primary End-User)
*The portal provides students with self-service tools to manage their entire academic journey.*

1. **Onboarding & Security:**
   - **First Login:** The student logs in using their Student ID and the default password provided by the university.
   - **Security Enforcement:** The system immediately forces them to change their password to a secure, personal one before allowing access to the dashboard.
2. **Advising & Course Registration:**
   - **Checking Eligibility:** When the advising window approaches, the student checks if their specific credit bracket is currently active. The system prevents access if they have financial dues or if their timeslot hasn't opened.
   - **Course Selection:** The student browses the available catalog. The system intelligently categorizes courses into "New", "Retake" (failed courses), and "Recommended Retake" (courses passed with a poor grade).
   - **Checkout:** The student adds courses to their "slip" and confirms their registration, instantly updating their schedule.
3. **Academic Monitoring & Adjustments:**
   - **Schedule & History:** The student can view their current weekly schedule and their entire academic history (organized by semester).
   - **Course Drops:** During an Admin-defined "Drop Period," the student can drop individual courses directly from their schedule.
   - **Semester Drops:** If necessary, the student can submit a formal request with a detailed reason to drop the entire semester, which pauses their academic progression until Admin approval.
4. **Communication & Recovery:**
   - **Messaging:** Students can securely message their faculty advisors for academic help or the Admin team for system/financial issues.
   - **Account Recovery:** If locked out, students can submit a password recovery request by verifying their Student ID, registered email, and Date of Birth.

---

## 2. Project Review & Technical Architecture

### Tech Stack
- **Frontend:** React (Vite), React Router, Context API for state management, CSS Modules (SCSS) for scoped styling.
- **Backend:** Node.js, Express.js.
- **Database:** MySQL with `mysql2/promise` for async database operations.
- **Security:** JWT (JSON Web Tokens) stored in HttpOnly cookies, bcryptjs for password hashing.

### Strengths & Highlights
> [!TIP]
> **Robust Security Posture**
> The migration to HttpOnly cookies and JWTs significantly mitigates XSS attacks. The implementation of a forced password reset for default passwords and the multi-factor identity check (ID + Email + DOB) for password recovery are excellent enterprise-grade security features.

> [!NOTE]
> **Intelligent Semester Transitions**
> The `semesterManager.js` architecture is a standout feature. It automates the complex transition between semesters (Spring -> Summer -> Fall), automatically moving ungraded courses to 'pending' and graded courses to 'completed', while seamlessly cloning the course catalog for the next term.

> [!IMPORTANT]
> **Strict Business Logic Enforcement**
> The system does an excellent job of enforcing university rules at the API level:
> - Advising is blocked if financial dues exist (`payment_status = 'Due'`).
> - Advising is gated by dynamic time-and-credit slots to prevent server overload.
> - Course drops are strictly tied to Admin-defined drop periods.

> [!TIP]
> **Clean UI/UX**
> The frontend uses a modern, responsive design with clear visual indicators (badges, banners, conditional icons). The separation of dashboards by role (Admin, Faculty, Student) ensures a focused experience for each user type.

### Areas for Improvement / Future Roadmap

> [!WARNING]
> **Pagination & Scalability**
> Currently, endpoints like "Get All Students" or "Get All Courses" return the entire dataset. As the university grows, this will cause slow load times. 
> *Recommendation: Implement cursor-based or offset pagination on the backend and infinite scrolling or data tables on the frontend.*

> [!WARNING]
> **Email Notifications**
> Currently, the system relies entirely on the user logging in to check statuses (e.g., password reset approvals, semester drop approvals).
> *Recommendation: Integrate an email service (like SendGrid or AWS SES) to send automated transactional emails when important actions occur.*

> [!CAUTION]
> **Audit Logging**
> While the system tracks current state well, it lacks a comprehensive audit trail for critical actions (e.g., *who* updated a student's grade, *when* a financial status was changed).
> *Recommendation: Create an `audit_logs` table to track sensitive `PUT`/`POST`/`DELETE` operations for compliance and debugging.*

> [!NOTE]
> **File Attachments**
> The messaging system and the semester drop requests currently only support text. 
> *Recommendation: Integrate a cloud storage solution (like AWS S3) to allow students to attach medical documents to drop requests or files to messages.*
