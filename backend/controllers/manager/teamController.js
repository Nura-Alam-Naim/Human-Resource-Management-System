import db from '../../db.js';

export const getTeamAnalytics = async (req, res) => {
    try {
        let deptFilter = 'WHERE department_id = (SELECT department_id FROM users WHERE id = ?)';
        const params = [req.user.id];

        const [[{ total_employees }]] = await db.query(`SELECT COUNT(*) as total_employees FROM users ${deptFilter}`, params);
        
        let requestFilter = "WHERE lr.status = 'pending' AND u.department_id = (SELECT department_id FROM users WHERE id = ?)";
        const [[{ pending_requests }]] = await db.query(`
            SELECT COUNT(*) as pending_requests 
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            ${requestFilter}
        `, params);

        let requestFilterApp = "WHERE lr.status = 'approved' AND u.department_id = (SELECT department_id FROM users WHERE id = ?)";
        const [[{ approved_requests }]] = await db.query(`
            SELECT COUNT(*) as approved_requests 
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            ${requestFilterApp}
        `, params);
        
        const [leave_distribution] = await db.query(`
            SELECT lt.type_name as name, COUNT(lr.id) as value
            FROM leave_requests lr
            JOIN leave_types lt ON lr.type_id = lt.id
            JOIN users u ON lr.user_id = u.id
            WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?)
            GROUP BY lt.id
        `, params);

        const [leave_status_distribution] = await db.query(`
            SELECT lr.status as name, COUNT(lr.id) as value
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?)
            GROUP BY lr.status
        `, params);

        const [worktime_stats] = await db.query(`
            SELECT DATE_FORMAT(a.date, '%a') as day, ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.clock_in, a.clock_out) / 60), 1) as avg_hours
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
              AND a.clock_out IS NOT NULL
              AND u.department_id = (SELECT department_id FROM users WHERE id = ?)
            GROUP BY a.date
            ORDER BY a.date ASC
        `, params);

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

export const getTeamUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'WHERE u.department_id = (SELECT department_id FROM users WHERE id = ?)';
        const params = [req.user.id];

        if (search) {
            whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)';
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

export const getTeamUserProfile = async (req, res) => {
    try {
        const userId = req.params.user_id;

        const q = `
            SELECT u.id, u.employee_id, u.name, u.email, u.role, u.total_leave_balance,
                   d.name as department_name, des.title as designation_title
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN designations des ON u.designation_id = des.id
            WHERE u.id = ? AND u.department_id = (SELECT department_id FROM users WHERE id = ?)
        `;
        const [rows] = await db.query(q, [userId, req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found in your department." });
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

export const createMemberRequest = async (req, res) => {
    try {
        const { requested_role, description } = req.body;
        const managerId = req.user.id;

        const [[managerDept]] = await db.query(`SELECT department_id FROM users WHERE id = ?`, [managerId]);
        if (!managerDept || !managerDept.department_id) {
            return res.status(400).json({ message: "You are not assigned to a department." });
        }

        const departmentId = managerDept.department_id;

        const q = "INSERT INTO member_requests (manager_id, department_id, requested_role, description) VALUES (?, ?, ?, ?)";
        await db.query(q, [managerId, departmentId, requested_role, description]);

        res.status(201).json({ message: "Member request submitted to Admin successfully!" });
    } catch (error) {
        console.error("Error creating member request", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyMemberRequests = async (req, res) => {
    try {
        let q = `
            SELECT mr.id, mr.requested_role, mr.description, mr.status, mr.created_at,
                   u.name as manager_name, d.name as department_name
            FROM member_requests mr
            JOIN users u ON mr.manager_id = u.id
            JOIN departments d ON mr.department_id = d.id
            WHERE mr.manager_id = ?
            ORDER BY mr.created_at DESC
        `;
        
        const [rows] = await db.query(q, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching member requests", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTeamDesignations = async (req, res) => {
    try {
        const [[manager]] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
        if (!manager || !manager.department_id) {
            return res.json([]);
        }
        const [designations] = await db.query('SELECT * FROM designations WHERE department_id = ? ORDER BY title ASC', [manager.department_id]);
        res.json(designations);
    } catch (error) {
        console.error("Error fetching designations", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateTeamUserDesignation = async (req, res) => {
    try {
        const userId = req.params.user_id;
        const { designation_id } = req.body;
        
        // Ensure user belongs to manager's department
        const [rows] = await db.query('SELECT department_id FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ message: "User not found" });
        
        const [managerRow] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
        if (rows[0].department_id !== managerRow[0].department_id) {
            return res.status(403).json({ message: "Not authorized to update this user" });
        }
        
        await db.query('UPDATE users SET designation_id = ? WHERE id = ?', [designation_id || null, userId]);
        res.json({ message: "Designation updated successfully" });
    } catch (error) {
        console.error("Error updating user designation", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createTeamDesignation = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ message: "Job title is required" });

        const [[manager]] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
        if (!manager || !manager.department_id) {
            return res.status(400).json({ message: "You are not assigned to a department" });
        }

        const [result] = await db.query(
            'INSERT INTO designations (title, department_id) VALUES (?, ?)',
            [title, manager.department_id]
        );
        res.status(201).json({ message: 'Designation created successfully', id: result.insertId });
    } catch (error) {
        console.error("Error creating designation", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
