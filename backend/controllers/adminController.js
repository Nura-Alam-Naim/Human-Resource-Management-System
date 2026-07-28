import db from '../db.js';
import bcrypt from 'bcrypt';


// Manager: Get ALL Requests (Pending, Approved, Rejected)
export const getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '';
        const params = [];
        if (search) {
            whereClause = 'WHERE u.name LIKE ? OR lr.reason LIKE ? OR lr.status LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const countQuery = `
            SELECT COUNT(*) as total FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            ${whereClause}
        `;
        const [[{ total }]] = await db.query(countQuery, params);

        const q = `SELECT 
                lr.id, lr.user_id, lr.start_date, lr.end_date, lr.reason, lr.status,
                u.name AS employee_name, 
                lt.type_name
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            JOIN leave_types lt ON lr.type_id = lt.id
            ${whereClause}
            ORDER BY lr.start_date DESC
            LIMIT ? OFFSET ?`;

        const [rows] = await db.query(q, [...params, limit, offset]);

        res.json({
            data: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching all requests", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Manager: Update Status
export const updateStatus = async (req, res) => {
    try {
        const requestId = req.params.request_id;
        const { status } = req.body; // 'approved' or 'rejected'

        const [oldReq] = await db.query(`SELECT status, user_id, DATEDIFF(end_date, start_date) + 1 AS days_taken FROM leave_requests WHERE id = ?`, [requestId]);
        if (oldReq.length === 0) return res.status(404).json({ message: "Request not found" });
        
        const oldStatus = oldReq[0].status;
        const daysTaken = oldReq[0].days_taken;
        const userId = oldReq[0].user_id;

        const q = `UPDATE leave_requests SET status = ? WHERE id = ?`;
        await db.query(q, [status, requestId]);

        if (status === 'approved' && oldStatus !== 'approved') {
            await db.query(`UPDATE users SET total_leave_balance = total_leave_balance - ? WHERE id = ?`, [daysTaken, userId]);
        } else if ((status === 'rejected' || status === 'cancelled') && oldStatus === 'approved') {
            await db.query(`UPDATE users SET total_leave_balance = total_leave_balance + ? WHERE id = ?`, [daysTaken, userId]);
        }

        // Log the action
        await db.query(
            `INSERT INTO activity_logs (action, performed_by, target_user, details) VALUES (?, ?, ?, ?)`,
            [`${status.charAt(0).toUpperCase() + status.slice(1)} Leave Request`, req.user.id, userId, `Status updated to ${status} for request ID ${requestId}`]
        );

        res.json({ message: `Leave ${status} successfully!` });
    } catch (error) {
        console.error("Error updating status", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Manager: View a User's Profile
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const q = "SELECT id, name, email, role, total_leave_balance FROM users WHERE id = ?";
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

// Manager: Create a new user
export const createUser = async (req, res) => {
    try {
        const { name, email, role, total_leave_balance } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ message: "Name, email, and role are required." });
        }

        // Hash default temporary password
        const defaultPassword = await bcrypt.hash('Welcome@123', 10);
        const leaveBalance = total_leave_balance || 20;

        const q = "INSERT INTO users (name, email, password, role, total_leave_balance, is_first_login) VALUES (?, ?, ?, ?, ?, TRUE)";
        const [result] = await db.query(q, [name, email, defaultPassword, role, leaveBalance]);

        // Log the action
        await db.query(
            `INSERT INTO activity_logs (action, performed_by, target_user, details) VALUES (?, ?, ?, ?)`,
            ['Create User', req.user.id, result.insertId, `Created new ${role}: ${email}`]
        );

        res.status(201).json({ message: "User created successfully with temporary password 'Welcome@123'.", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "A user with this email already exists." });
        }
        console.error("Error creating user", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Manager: Get all users with leave stats
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
            SELECT u.id, u.name, u.email, u.role, u.total_leave_balance, u.created_at,
            COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN DATEDIFF(lr.end_date, lr.start_date) + 1 ELSE 0 END), 0) AS total_leaves_taken
            FROM users u
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

// Manager: Get Analytics
export const getAnalytics = async (req, res) => {
    try {
        const [[{ total_employees }]] = await db.query(`SELECT COUNT(*) as total_employees FROM users`);
        const [[{ pending_requests }]] = await db.query(`SELECT COUNT(*) as pending_requests FROM leave_requests WHERE status = 'pending'`);
        const [[{ approved_requests }]] = await db.query(`SELECT COUNT(*) as approved_requests FROM leave_requests WHERE status = 'approved'`);
        
        const [leave_distribution] = await db.query(`
            SELECT lt.type_name as name, COUNT(lr.id) as value
            FROM leave_requests lr
            JOIN leave_types lt ON lr.type_id = lt.id
            GROUP BY lt.id
        `);

        res.json({
            total_employees,
            pending_requests,
            approved_requests,
            leave_distribution
        });
    } catch (error) {
        console.error("Error fetching analytics", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Manager: Get Activity Logs
export const getActivityLogs = async (req, res) => {
    try {
        const q = `
            SELECT al.id, al.action, al.details, al.created_at,
                   u1.name as performer_name, u2.name as target_name
            FROM activity_logs al
            LEFT JOIN users u1 ON al.performed_by = u1.id
            LEFT JOIN users u2 ON al.target_user = u2.id
            ORDER BY al.created_at DESC
            LIMIT 50
        `;
        const [rows] = await db.query(q);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching activity logs", error);
        res.status(500).json({ message: "Server error" });
    }
};
