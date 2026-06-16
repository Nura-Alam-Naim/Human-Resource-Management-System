import db from '../db.js';


export const profile = async (req, res) => {
    try {
        const userId = req.user.id;

        const q = "SELECT id, name, email, role, total_leave_balance, created_at FROM users WHERE id = ?";
        const [rows] = await db.query(q, [userId]);

        const leaveStatsQuery = "SELECT SUM(DATEDIFF(end_date, start_date) + 1) AS total_leaves_taken FROM leave_requests WHERE user_id = ? AND status = 'approved'";
        const [leaveStats] = await db.query(leaveStatsQuery, [userId]);

        const userProfile = rows[0];
        userProfile.total_leaves_taken = leaveStats[0].total_leaves_taken || 0;

        res.json(userProfile);
    } catch (error) {
        console.error("error getting profile", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Employee: Get My Requests
export const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const q = "SELECT lr.id, lr.start_date, lr.end_date, lr.reason, lr.status, lt.type_name, lr.type_id FROM leave_requests lr JOIN leave_types lt ON lr.type_id = lt.id WHERE lr.user_id = ? ORDER BY lr.start_date DESC";
        const [rows] = await db.query(q, [userId]);

        res.json(rows);
    } catch (error) {
        console.error("error getting requests", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Employee: Apply For Leave
export const applyForLeave = async (req, res) => {
    try {
        const { type_id, start_date, end_date, reason } = req.body;
        const userId = req.user.id;
        // Fix: Added missing 'await'
        const [remainingDays] = await db.query("SELECT total_leave_balance FROM users WHERE id = ?", [userId]);

        // Fix: DATEDIFF is an SQL function, not a JavaScript function. 
        // We must calculate the days manually in JS using the Date object:
        const start = new Date(start_date);
        const end = new Date(end_date);
        const days_taken = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (remainingDays[0].total_leave_balance < days_taken) {
            return res.status(400).json({ message: "Insufficient leave balance" });
        }

        const q = "INSERT INTO leave_requests (user_id, type_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        const values = [userId, type_id, start_date, end_date, reason];

        const [result] = await db.query(q, values);

        res.status(201).json({ message: "Leave applied successfully!", id: result.insertId });
    } catch (error) {
        console.error("Error applying for leave", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Employee: Edit a Pending Request
export const editLeaveRequest = async (req, res) => {
    try {
        const requestId = req.params.request_id;
        const { type_id, start_date, end_date, reason } = req.body;

        // Ensure we only update if it is still 'pending'
        const q = "UPDATE leave_requests SET type_id = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ? AND status = 'pending'";
        const [result] = await db.query(q, [type_id, start_date, end_date, reason, requestId]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Cannot edit. Request is either not pending or does not exist." });
        }

        res.json({ message: "Leave request updated successfully!" });
    } catch (error) {
        console.error("Error editing request", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Employee: Cancel a Pending Request
export const cancelLeaveRequest = async (req, res) => {
    try {
        const requestId = req.params.request_id;

        // Ensure we only cancel if it is still 'pending'
        const q = "UPDATE leave_requests SET status = 'cancelled' WHERE id = ? AND status = 'pending'";
        const [result] = await db.query(q, [requestId]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: "Cannot cancel. Request is either not pending or does not exist." });
        }

        res.json({ message: "Leave request cancelled successfully!" });
    } catch (error) {
        console.error("Error cancelling request", error);
        res.status(500).json({ message: "Server error" });
    }
};

