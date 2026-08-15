import db from '../../db.js';

export const getMyPayslips = async (req, res) => {
    try {
        const userId = req.user.id;
        const q = `
            SELECT * 
            FROM payslips 
            WHERE user_id = ?
            ORDER BY year DESC, month DESC
        `;
        const [rows] = await db.query(q, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching my payslips:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
