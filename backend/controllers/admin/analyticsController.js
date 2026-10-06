import db from '../../database/db.js';

export const getAnalytics = async (req, res) => {
    try {
        const [[{ total_employees }]] = await db.query(`SELECT COUNT(*) as total_employees FROM users WHERE company_id = ?`, [req.user.company_id]);
        
        const [[{ pending_requests }]] = await db.query(`
            SELECT COUNT(*) as pending_requests 
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            WHERE lr.status = 'pending' AND lr.company_id = ?
        `, [req.user.company_id]);

        const [[{ approved_requests }]] = await db.query(`
            SELECT COUNT(*) as approved_requests 
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            WHERE lr.status = 'approved' AND lr.company_id = ?
        `, [req.user.company_id]);
        
        const [leave_distribution] = await db.query(`
            SELECT lt.type_name as name, COUNT(lr.id) as value
            FROM leave_requests lr
            JOIN leave_types lt ON lr.type_id = lt.id
            WHERE CURDATE() BETWEEN lr.start_date AND lr.end_date AND lr.company_id = ?
            GROUP BY lt.id
        `, [req.user.company_id]);

        const [leave_status_distribution] = await db.query(`
            SELECT status as name, COUNT(id) as value
            FROM leave_requests
            WHERE CURDATE() BETWEEN start_date AND end_date AND company_id = ?
            GROUP BY status
        `, [req.user.company_id]);

        const [worktime_stats] = await db.query(`
            SELECT DATE_FORMAT(date, '%a') as day, ROUND(AVG(TIMESTAMPDIFF(MINUTE, clock_in, clock_out) / 60), 1) as avg_hours
            FROM attendance
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND clock_out IS NOT NULL AND company_id = ?
            GROUP BY date
            ORDER BY date ASC
        `, [req.user.company_id]);

        res.json({
            total_employees,
            pending_requests,
            approved_requests,
            leave_distribution,
            leave_status_distribution,
            worktime_stats
        });
    } catch (error) {
        console.error("Error fetching analytics", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getActivityLogs = async (req, res) => {
    try {
        const q = `
            SELECT al.id, al.action, al.details, al.created_at,
                   u1.name as performer_name, u1.role as performer_role,
                   u2.name as target_name, u2.role as target_role
            FROM activity_logs al
            LEFT JOIN users u1 ON al.performed_by = u1.id
            LEFT JOIN users u2 ON al.target_user = u2.id
            WHERE al.company_id = ?
            ORDER BY al.created_at DESC
            LIMIT 50
        `;
        const [rows] = await db.query(q, [req.user.company_id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching activity logs", error);
        res.status(500).json({ message: "Server error" });
    }
};
