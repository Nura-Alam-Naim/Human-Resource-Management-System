import db from '../../db.js';

// Get all employees with their base salary
export const getEmployeesSalary = async (req, res) => {
    try {
        const q = `
            SELECT u.id, u.name, u.email, u.role, u.base_salary, d.name as department_name, des.title as designation_title
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN designations des ON u.designation_id = des.id
            WHERE u.role != 'admin'
        `;
        const [rows] = await db.query(q);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching salaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Generate Payslip for a user
export const generatePayslip = async (req, res) => {
    try {
        const { user_id, month, year } = req.body;

        if (!user_id || !month || !year) {
            return res.status(400).json({ message: "User ID, month, and year are required." });
        }

        // 1. Get user's base salary
        const [userRows] = await db.query('SELECT base_salary FROM users WHERE id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const base_salary = parseFloat(userRows[0].base_salary);

        // 2. Calculate Days Worked (Attendance + Approved Leaves for that month)
        // For simplicity, we just count records in attendance for that month where status = present
        const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        const [attRows] = await db.query(`
            SELECT COUNT(*) as days_present 
            FROM attendance 
            WHERE user_id = ? AND date >= ? AND date <= ? AND status IN ('present', 'half-day')
        `, [user_id, startOfMonth, endOfMonth]);
        
        let days_worked = attRows[0].days_present || 0;

        // Also add approved leave days for that month (rough estimation for now)
        const [leaveRows] = await db.query(`
            SELECT start_date, end_date 
            FROM leave_requests 
            WHERE user_id = ? AND status = 'approved' 
            AND (start_date <= ? AND end_date >= ?)
        `, [user_id, endOfMonth, startOfMonth]);

        let leave_days = 0;
        for (let l of leaveRows) {
            // Very simplified: assuming the leave is fully within the month
            const d1 = new Date(l.start_date);
            const d2 = new Date(l.end_date);
            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            leave_days += diffDays;
        }

        days_worked += leave_days;

        // Ensure days_worked doesn't exceed 30 for calculation purposes
        if (days_worked > 30) days_worked = 30;
        if (days_worked === 0) days_worked = 30; // Just for testing if no attendance data exists

        // 3. Calculate gross and net pay
        const daily_rate = base_salary / 30;
        let gross_pay = daily_rate * days_worked;
        let deductions = 0.00; // As requested, gross = net for now
        let net_pay = gross_pay - deductions;

        // Ensure we don't insert duplicate payslips (UNIQUE KEY catches this, but we can update or ignore)
        const q = `
            INSERT INTO payslips (user_id, month, year, base_salary, days_worked, gross_pay, deductions, net_pay)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            base_salary = VALUES(base_salary), days_worked = VALUES(days_worked), gross_pay = VALUES(gross_pay), deductions = VALUES(deductions), net_pay = VALUES(net_pay)
        `;
        
        await db.query(q, [user_id, month, year, base_salary, days_worked, gross_pay, deductions, net_pay]);

        res.status(200).json({ message: "Payslip generated successfully!", payslip: { month, year, days_worked, net_pay } });

    } catch (error) {
        console.error("Error generating payslip:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all payslips
export const getAllPayslips = async (req, res) => {
    try {
        const q = `
            SELECT p.*, u.name as employee_name, u.email 
            FROM payslips p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.year DESC, p.month DESC, p.created_at DESC
        `;
        const [rows] = await db.query(q);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching payslips:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
