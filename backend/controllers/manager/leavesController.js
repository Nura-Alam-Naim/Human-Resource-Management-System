import db from '../../db.js';
import { calculateWorkingDays } from '../../utils/leaveUtils.js';

export const getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?)';
        const params = [req.user.id];

        if (search) {
            whereClause += ' AND (u.name LIKE ? OR lr.reason LIKE ? OR lr.status LIKE ?)';
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

export const updateStatus = async (req, res) => {
    try {
        const requestId = req.params.request_id;
        const { status } = req.body; // 'approved' or 'rejected'

        const [oldReq] = await db.query(`
            SELECT lr.status, lr.user_id, lr.start_date, lr.end_date, u.role as requester_role 
            FROM leave_requests lr 
            JOIN users u ON lr.user_id = u.id 
            WHERE lr.id = ?
        `, [requestId]);

        if (oldReq.length === 0) return res.status(404).json({ message: "Request not found" });
        
        const oldStatus = oldReq[0].status;
        const userId = oldReq[0].user_id;
        const requesterRole = oldReq[0].requester_role;
        
        const daysTaken = await calculateWorkingDays(oldReq[0].start_date, oldReq[0].end_date);

        if (status === 'approved' && requesterRole !== 'employee') {
            return res.status(403).json({ message: "Managers can only approve employee requests." });
        }

        const q = `UPDATE leave_requests SET status = ? WHERE id = ?`;
        await db.query(q, [status, requestId]);

        if (status === 'approved' && oldStatus !== 'approved') {
            await db.query(`UPDATE users SET total_leave_balance = total_leave_balance - ? WHERE id = ?`, [daysTaken, userId]);
        } else if ((status === 'rejected' || status === 'cancelled') && oldStatus === 'approved') {
            await db.query(`UPDATE users SET total_leave_balance = total_leave_balance + ? WHERE id = ?`, [daysTaken, userId]);
        }

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
