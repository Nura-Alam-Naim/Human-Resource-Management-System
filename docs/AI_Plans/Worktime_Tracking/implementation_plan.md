# Add Worktime Tracking Graphs

This plan outlines the addition of worktime charts to track and visualize employee working hours. We'll add a 7-day worktime bar chart to both the Employee Dashboard (so employees can see their own worktime) and the Employee Profile View (so managers and admins can see individual employee worktimes).

## User Review Required

> [!IMPORTANT]
> The backend will calculate the average hours worked over the last 7 days. If a user didn't clock out on a specific day, that day won't be counted in the graph. Please let me know if you want to extend this to 30 days instead of 7 days, or if you prefer a different graph type instead of a Bar Chart.

## Proposed Changes

### Backend (Controllers)

We'll add a SQL query to fetch the last 7 days of worktime stats for a specific user.

#### [MODIFY] [leavesController.js](file:///Users/nuraalamnaim/Naim/Programming/Projects/Leave_Management_Portal/backend/controllers/employee/leavesController.js)
- Update the `profile` endpoint to include `worktime_stats` by querying the `attendance` table for the logged-in user.

#### [MODIFY] [teamController.js](file:///Users/nuraalamnaim/Naim/Programming/Projects/Leave_Management_Portal/backend/controllers/manager/teamController.js)
- Update the `getTeamUserProfile` endpoint to include `worktime_stats` for the specified employee so managers can see it.

#### [MODIFY] [usersController.js](file:///Users/nuraalamnaim/Naim/Programming/Projects/Leave_Management_Portal/backend/controllers/admin/usersController.js)
- Update the `getUserProfile` endpoint to include `worktime_stats` for the specified employee so admins can see it.

---

### Frontend (React Components)

We will use `Recharts` to render a `BarChart`.

#### [MODIFY] [EmployeeDashboard.jsx](file:///Users/nuraalamnaim/Naim/Programming/Projects/Leave_Management_Portal/frontend/src/pages/EmployeeDashboard.jsx)
- Import `Recharts` (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, etc.).
- Render a new "Weekly Work Time (Avg Hours)" card using `profile.worktime_stats`.

#### [MODIFY] [EmployeeProfileView.jsx](file:///Users/nuraalamnaim/Naim/Programming/Projects/Leave_Management_Portal/frontend/src/components/EmployeeProfileView.jsx)
- Import `Recharts`.
- Add a new "Weekly Work Time (Avg Hours)" chart below the Leave History table using `userProfile.worktime_stats`.

## Verification Plan

### Automated Tests
- Check that the dev server rebuilds without syntax errors.

### Manual Verification
- Log in as an **employee** and verify the dashboard shows a weekly worktime chart.
- Log in as an **admin** or **manager**, click on an employee's profile, and verify the worktime chart renders in their profile modal.
- Verify that the chart renders properly in dark mode.
