import db from '../db.js';
import bcrypt from 'bcrypt';


// Manager: Get ALL Requests (Pending, Approved, Rejected)
export const getAllRequests = async (req, res) => {
    try {
        const q = `SELECT 
                lr.id, lr.user_id, lr.start_date, lr.end_date, lr.reason, lr.status,
                u.name AS employee_name, 
                lt.type_name
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            JOIN leave_types lt ON lr.type_id = lt.id
            ORDER BY lr.start_date DESC`;

        const [rows] = await db.query(q);
        res.json(rows);
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

        const q = `UPDATE leave_requests SET status = ? WHERE id = ?`;
        await db.query(q, [status, requestId]);

        if (status === 'approved') {
            const [requestData] = await db.query(`SELECT user_id, DATEDIFF(end_date, start_date) + 1 AS days_taken FROM leave_requests WHERE id = ?`, [requestId]);

            const userId = requestData[0].user_id;
            const daysTaken = requestData[0].days_taken;

            const q = `UPDATE users SET total_leave_balance = total_leave_balance - ? WHERE id = ?`;
            await db.query(q, [daysTaken, userId]);
        }
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

        res.status(201).json({ message: "User created successfully with temporary password 'Welcome@123'.", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "A user with this email already exists." });
        }
        console.error("Error creating user", error);
        res.status(500).json({ message: "Server error" });
    }
};
