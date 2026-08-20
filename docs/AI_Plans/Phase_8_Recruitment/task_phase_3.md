# 🏖️ HRMS Phase 3: Advanced Leave Logic & Multi-Level Approvals

This task list tracks our progress for upgrading the leave system to corporate standards.

## 1. Database & Schema Updates
- `[x]` Alter `leave_requests` table: update `status` ENUM to support two-tier approvals (`pending_manager`, `pending_hr`, `approved`, `rejected`, `cancelled`).
- `[x]` Create `public_holidays` table (`id`, `date`, `name`) in `db.js`.
- `[x]` Write the Phase 3 migration script in `db.js` without data loss.

## 2. Advanced Backend Logic
- `[x]` **Weekend & Holiday Exclusion:** Update the `applyForLeave` logic so that if an employee requests leave from Friday to Monday (4 days), the system only deducts **2 days** from their balance (skipping Sat/Sun and any public holidays).
- `[x]` **Multi-Level Approvals:** 
  - When an employee applies, status is `pending_manager`.
  - Line Manager approves -> status becomes `pending_hr`.
  - HR Admin approves -> status becomes `approved` (and balance is deducted).
- `[x]` **Accrual Engine:** Build a Cron Job that runs at the end of every month, automatically adding **1.5 days** of leave balance to all active employees.

## 3. Frontend Development (UI/UX)
- `[x]` **Department Filtering:** Update the Manager Dashboard so that Line Managers ONLY see leave requests from employees inside their specific department!
- `[x]` **HR Admin Panel:** Ensure HR Admins can see the `pending_hr` requests and give final approval.
- `[x]` **Holidays Settings:** Create an admin page where HR can add/remove Public Holidays for the year.

## 4. Automated Testing
- `[x]` Write Jest integration tests ensuring Weekends are not counted as leave days.
- `[x]` Test the 2-step approval chain.
