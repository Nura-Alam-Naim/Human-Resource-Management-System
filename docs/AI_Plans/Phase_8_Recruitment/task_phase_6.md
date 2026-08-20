# HRMS Phase 6: Payroll & Salary Calculations

## 1. Database Migration
- `[x]` Add `base_salary` column to `users` table via `backend/db.js`
- `[x]` Create `payslips` table via `backend/db.js`

## 2. Backend Payroll Engine
- `[x]` Create `backend/controllers/admin/payrollController.js` (Generate payslips)
- `[x]` Create `backend/controllers/employee/payrollController.js` (View own payslips)
- `[x]` Create `backend/routes/admin/payrollRoute.js`
- `[x]` Create `backend/routes/employee/payrollRoute.js`
- `[x]` Mount routes in `backend/index.js`

## 3. Admin UI: Payroll Management
- `[x]` Create `frontend/src/pages/PayrollManagement.jsx`
- `[x]` Create `frontend/src/pages/PayrollManagement.scss`
- `[x]` Add Payroll link to `frontend/src/components/Navbar.jsx`
- `[x]` Add route to `frontend/src/App.jsx`

## 4. Employee UI: My Payslips
- `[x]` Create `frontend/src/pages/MyPayslips.jsx`
- `[x]` Create `frontend/src/pages/MyPayslips.scss`
- `[x]` Add My Payslips link to `frontend/src/components/Navbar.jsx`
- `[x]` Add route to `frontend/src/App.jsx`
