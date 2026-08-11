import db from '../../db.js';
import bcrypt from 'bcrypt';

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const q = `
            SELECT u.id, u.employee_id, u.name, u.email, u.role, u.total_leave_balance,
                   d.name as department_name, des.title as designation_title
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN designations des ON u.designation_id = des.id
            WHERE u.id = ?
        `;
        const [rows] = await db.query(q, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const historyQuery = `
            SELECT lr.id, lr.start_date, lr.end_date, lr.reason, lr.status, lt.type_name 
            FROM leave_requests lr 
            JOIN leave_types lt ON lr.type_id = lt.id 
            WHERE lr.user_id = ? 
            ORDER BY lr.start_date DESC
        `;
        const [historyRows] = await db.query(historyQuery, [userId]);

        res.json({
            user: rows[0],
            history: historyRows
        });
    } catch (error) {
        console.error("Error fetching user profile", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, email, role, total_leave_balance, department_id, designation_id } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ message: "Name, email, and role are required." });
        }

        const defaultPassword = await bcrypt.hash('Welcome@123', 10);
        const leaveBalance = total_leave_balance || 20;

        const q = "INSERT INTO users (name, email, password, role, total_leave_balance, is_first_login, department_id, designation_id) VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)";
        const [result] = await db.query(q, [name, email, defaultPassword, role, leaveBalance, department_id || null, designation_id || null]);
        
        const empId = `EMP-${result.insertId.toString().padStart(3, '0')}`;
        await db.query("UPDATE users SET employee_id = ? WHERE id = ?", [empId, result.insertId]);

        await db.query(
            `INSERT INTO activity_logs (action, performed_by, target_user, details) VALUES (?, ?, ?, ?)`,
            ['Create User', req.user.id, result.insertId, `Created new ${role}: ${email} (${empId})`]
        );

        res.status(201).json({ message: `User created successfully with temporary password 'Welcome@123'. Employee ID: ${empId}`, id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "A user with this email already exists." });
        }
        console.error("Error creating user", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '';
        const params = [];

        if (search) {
            whereClause = 'WHERE u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
        const [[{ total }]] = await db.query(countQuery, params);

        const q = `
            SELECT u.id, u.employee_id, u.name, u.email, u.role, u.total_leave_balance, u.created_at,
            d.name as department_name, des.title as designation_title,
            COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN DATEDIFF(lr.end_date, lr.start_date) + 1 ELSE 0 END), 0) AS total_leaves_taken,
            (SELECT COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.clock_in, a.clock_out) / 60), 1), 0)
             FROM attendance a 
             WHERE a.user_id = u.id AND a.date >= DATE_SUB(CURDATE(), INTERVAL 5 DAY) AND a.clock_out IS NOT NULL) AS avg_daily_hours
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN designations des ON u.designation_id = des.id
            LEFT JOIN leave_requests lr ON u.id = lr.user_id
            ${whereClause}
            GROUP BY u.id
            ORDER BY u.name ASC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(q, [...params, limit, offset]);

        res.json({
            data: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching all users", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUserDesignation = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const { designation_id } = req.body;
        
        await db.query('UPDATE users SET designation_id = ? WHERE id = ?', [designation_id || null, userId]);
        res.json({ message: "Designation updated successfully" });
    } catch (error) {
        console.error("Error updating user designation", error);
        res.status(500).json({ message: "Server error" });
    }
};
