import db from '../../database/db.js';

export const getMemberRequests = async (req, res) => {
    try {
        let q = `
            SELECT mr.id, mr.requested_role, mr.description, mr.status, mr.created_at,
                   u.name as manager_name, d.name as department_name
            FROM member_requests mr
            JOIN users u ON mr.manager_id = u.id
            JOIN departments d ON mr.department_id = d.id
            WHERE mr.company_id = ?
            ORDER BY mr.created_at DESC
        `;
        
        const [rows] = await db.query(q, [req.user.company_id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching member requests", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMemberRequestById = async (req, res) => {
    try {
        const requestId = req.params.id;
        let q = `
            SELECT mr.id, mr.requested_role, mr.description, mr.status, mr.created_at, mr.department_id,
                   u.name as manager_name, d.name as department_name
            FROM member_requests mr
            JOIN users u ON mr.manager_id = u.id
            JOIN departments d ON mr.department_id = d.id
            WHERE mr.id = ? AND mr.company_id = ?
        `;
        
        const [rows] = await db.query(q, [requestId, req.user.company_id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Request not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching member request", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateMemberRequestStatus = async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        await db.query(`UPDATE member_requests SET status = ? WHERE id = ? AND company_id = ?`, [status, requestId, req.user.company_id]);

        res.json({ message: `Request ${status} successfully.` });
    } catch (error) {
        console.error("Error updating member request", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
