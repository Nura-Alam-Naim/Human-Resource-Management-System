import cron from 'node-cron';
import db from '../db.js';

export const startCronJobs = () => {

    // 1. Auto-Reject Expired Requests
    // Runs every day at 12:00 AM (Midnight)
    // Cron string: '0 0 * * *' (Minute:0, Hour:0, Day:*, Month:*, DayOfWeek:*)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log("Server is Refeshed");

            // If the end_date is strictly less than today, and status is still pending, reject it.
            const q = `
                UPDATE leave_requests 
                SET status = 'rejected' 
                WHERE status IN ('pending_manager', 'pending_hr', 'pending') AND end_date < CURDATE()
            `;

            const [result] = await db.query(q);

            if (result.affectedRows > 0) {
                console.log(`✅ Auto-rejected ${result.affectedRows} expired requests.`);
            } else {
                console.log("✅ No expired requests found.");
            }
        } catch (error) {
            console.error("❌ Error running auto-reject cron job:", error);
        }
    });


    // 2. Yearly Leave Balance Reset
    // Runs every January 1st at 12:00 AM
    // Cron string: '0 0 1 1 *' (Minute:0, Hour:0, Day:1, Month:1, DayOfWeek:*)
    cron.schedule('0 0 1 1 *', async () => {
        try {
            console.log("🎉 Happy New Year! Resetting leave balances...");

            // Reset every employee's leave balance to 20
            const q = `
                UPDATE users 
                SET total_leave_balance = 20
            `;

            await db.query(q);
            console.log("✅ All leave balances have been reset to 20 days.");
        } catch (error) {
            console.error("❌ Error running yearly reset cron job:", error);
        }
    });

    // 3. Monthly Accrual Engine
    // Runs on the 1st of every month at 12:00 AM
    // Cron string: '0 0 1 * *'
    cron.schedule('0 0 1 * *', async () => {
        try {
            console.log("📈 Running Monthly Accrual Engine...");
            // Add 1.5 days to everyone's balance
            const q = `
                UPDATE users 
                SET total_leave_balance = total_leave_balance + 1.5
            `;
            await db.query(q);
            console.log("✅ Accrued 1.5 days of leave for all employees.");
        } catch (error) {
            console.error("❌ Error running accrual cron job:", error);
        }
    });

    console.log("⏰ Cron jobs have been scheduled.");
};
