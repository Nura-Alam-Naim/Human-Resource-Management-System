# Phase 8: Recruitment & ATS (Applicant Tracking System)

The objective of Phase 8 is to expand the system from a pure internal HR portal into an external-facing recruitment platform. We will build a public Careers page where external candidates can view open positions and apply, along with an internal Applicant Tracking System (ATS) for Managers and Admins to manage the candidate pipeline.

## Proposed Changes

### 1. Database Schema Additions

We will introduce three new tables in `backend/db.js` to handle recruitment data:

#### `job_postings`
- `id` (PK)
- `title` (VARCHAR)
- `department_id` (FK to departments)
- `employment_type` (ENUM: full-time, part-time, contract, internship)
- `location` (VARCHAR)
- `description` (TEXT)
- `requirements` (TEXT)
- `status` (ENUM: open, closed, draft)
- `created_by` (FK to users - the admin/manager who posted it)

#### `job_applications`
- `id` (PK)
- `job_id` (FK to job_postings)
- `first_name` & `last_name` (VARCHAR)
- `email` & `phone` (VARCHAR)
- `resume_path` (VARCHAR) - Will integrate with our existing file upload system!
- `cover_letter` (TEXT)
- `status` (ENUM: new, reviewing, interviewing, offered, rejected)

#### `interviews`
- `id` (PK)
- `application_id` (FK to job_applications)
- `interviewer_id` (FK to users)
- `scheduled_time` (DATETIME)
- `meeting_link` (VARCHAR)
- `status` (ENUM: scheduled, completed, cancelled)
- `notes` (TEXT)

---

### 2. Frontend Architecture (Public Routing)

Currently, the React app forces all users to log in before seeing anything. We need to restructure `App.jsx` to allow public, unauthenticated routes.

- **[MODIFY]** `frontend/src/App.jsx`
  - Restructure the React Router so that `/careers` and `/careers/:jobId` bypass the `AuthContext` lockout. 
  - Ensure the authenticated portal remains completely guarded under the main layout.

---

### 3. External Job Board (Public)

- **[NEW]** `frontend/src/pages/Careers.jsx`
  - A beautiful, public-facing landing page listing all `open` job postings grouped by department.
  - No sidebar, no top navbar (or a specific public navbar), complete focus on the company's brand.
  
- **[NEW]** `frontend/src/pages/JobApplicationForm.jsx`
  - A page showing the job details and a form to submit an application.
  - Supports uploading a PDF/Docx resume.

---

### 4. Internal ATS Dashboard (Protected)

- **[NEW]** `frontend/src/pages/RecruitmentATS.jsx`
  - Accessible by **Admins** and **Managers**.
  - **Job Management:** Create, edit, and close job postings.
  - **Candidate Pipeline:** A Kanban-style or list view of applications for their department's jobs.
  - **Actions:** Move candidates between stages (New -> Reviewing -> Interviewing -> Offered -> Rejected).
  - **Interview Scheduling:** Assign an interviewer (Admin/Manager) and set a date/time for the interview.

---

### 5. Backend APIs

- **[NEW]** `backend/routes/public/careersRoute.js` & `backend/controllers/public/careersController.js`
  - `GET /api/careers/jobs`: Fetch open jobs.
  - `POST /api/careers/apply`: Submit an application (handles file uploads using `multer`).

- **[NEW]** `backend/routes/admin/atsRoute.js` & `backend/controllers/admin/atsController.js`
  - `GET /api/ats/jobs`: Fetch all jobs (including drafts/closed).
  - `POST /api/ats/jobs`: Create new posting.
  - `GET /api/ats/applications/:jobId`: View candidates.
  - `PUT /api/ats/applications/:id/status`: Update candidate stage.
  - `POST /api/ats/interviews`: Schedule an interview.

## Verification Plan

### Manual Verification
1. Open an Incognito window, navigate to `http://localhost:5173/careers`, and verify it loads without asking for a password.
2. Submit a test application with a fake resume PDF.
3. Log into the HR portal as an Admin, navigate to the Recruitment tab, and verify the new application appears in the "New" column.
4. Move the candidate to "Interviewing" and schedule a mock interview.

## User Review Required

> [!IMPORTANT]
> **Questions for you:**
> 1. Do you want Managers to be able to create new Job Postings, or should only Admins be allowed to create Job Postings?
> 2. For the public Careers page, should it adopt the same dark-mode styling as the portal, or do you want a specific "brighter" landing page design?
