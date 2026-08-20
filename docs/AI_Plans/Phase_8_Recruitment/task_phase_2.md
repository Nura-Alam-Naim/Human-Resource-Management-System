# ⏱️ HRMS Phase 2: Time & Attendance Tracking

This task list tracks our progress for building the Web Clock-In and Timesheet modules.

## 1. Database Schema
- `[x]` Create `attendance` table in `db.js` (`id`, `user_id`, `date`, `clock_in`, `clock_out`, `status`, `notes`).
- `[x]` Write a safe migration script in `db.js` to initialize this table without data loss.

## 2. Backend API Development
- `[x]` Build `POST /api/attendance/clock-in` (Records punch-in time).
- `[x]` Build `POST /api/attendance/clock-out` (Records punch-out time).
- `[x]` Build `GET /api/attendance/status` (Checks if the user is currently punched in today).
- `[x]` Build `GET /api/attendance/my-records` (Fetches data for the employee's timesheet).
- `[x]` Build `GET /api/admin/attendance` (Allows HR managers to view all employee timesheets).

## 3. Frontend Development (UI/UX)
- `[x]` **Dashboard Clock-In Widget:** Add a vibrant, dynamic panel to the user Dashboard showing the live current time, and a massive "Punch In / Punch Out" toggle button.
- `[x]` **My Timesheets:** Create a new page for employees to view their historical clock-in/out times and total hours worked per day.
- `[x]` **HR Attendance Monitor:** Create an admin page for Managers to oversee company-wide daily attendance.

## 4. Automated Testing
- `[x]` Write Jest integration tests to ensure employees cannot clock-in twice on the same day, and that clock-out calculates correctly.
