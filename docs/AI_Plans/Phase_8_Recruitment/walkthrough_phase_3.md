# 🏖️ HRMS Phase 3 Completed: Advanced Leave Logic

Phase 3 is fully operational! The Leave Management system has been heavily upgraded to match rigorous corporate standards and policies.

## What We Built

### 1. Smart Working-Days Calculator (Weekend & Holiday Exclusion)
The system now intelligently calculates how many leave days are actually being consumed!
*   **Weekend Exclusion:** If an employee requests leave from Thursday to Tuesday, the system correctly recognizes that Saturday and Sunday are not working days. It will only deduct **4 days** from their balance instead of 6!
*   **Public Holidays Integration:** It also checks against the new Public Holidays database. If a holiday falls inside their requested time off, they aren't charged a leave day for it.

### 2. Multi-Level Approvals
We have implemented a strict 2-tier approval pipeline.
1.  **Pending Manager:** When an employee applies, the request goes directly to their Line Manager.
2.  **Pending HR:** Once the Line Manager clicks "Approve", the request moves up the chain to the HR Admin.
3.  **Approved:** Only when the HR Admin gives the final seal of approval does the request become fully approved and the leave balance deducted.

### 3. Department-Level Privacy Filtering
*   **Line Managers:** The Manager Dashboard has been updated so that Line Managers (who are not HR Admins) will **only** see the leave requests from employees who are in their specific department!

### 4. Monthly Accrual Engine (Cron Job)
A scheduled background cron job has been activated. 
*   On the 1st of every month at midnight, the system will seamlessly run through every active employee and automatically add **1.5 days** to their `total_leave_balance`!

### 5. Holidays UI
HR Admins now have a dedicated **Holidays** page in their navigation bar to define all the company-wide public holidays for the year.

---

## Ready for Phase 4?
With Advanced Leave Logic locked in, our core leave system is rock solid. Next on our roadmap is **Phase 4: Employee Profiles & Document Management** (Allowing users to upload medical certificates and standardizing profile pictures). Let me know when you want to proceed!
