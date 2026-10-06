import db from '../../database/db.js';

// --- EMPLOYEE ROUTES ---

export const getMyClaims = async (req, res) => {
    try {
        const [claims] = await db.query(`
            SELECT e.*, u.name as approved_by_name
            FROM expense_claims e
            LEFT JOIN users u ON e.approved_by = u.id
            WHERE e.employee_id = ? AND e.company_id = ?
            ORDER BY e.created_at DESC
        `, [req.user.id, req.user.company_id]);
        
        res.json(claims);
    } catch (error) {
        console.error("Error fetching my claims:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const submitClaim = async (req, res) => {
    try {
        const { date, amount, category, description } = req.body;
        const receipt_path = req.file ? req.file.path : null;
        
        const q = `
            INSERT INTO expense_claims (employee_id, date, amount, category, description, receipt_path, status, company_id)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `;
        
        await db.query(q, [req.user.id, date, amount, category, description, receipt_path, req.user.company_id]);
        
        res.status(201).json({ message: "Expense claim submitted successfully!" });
    } catch (error) {
        console.error("Error submitting claim:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- MANAGER / ADMIN ROUTES ---

export const getManageableClaims = async (req, res) => {
    try {
        let q = `
            SELECT e.*, u.name as employee_name, u.department_id, d.name as department_name, a.name as approved_by_name
            FROM expense_claims e
            JOIN users u ON e.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN users a ON e.approved_by = a.id
        `;
        let params = [];
        
        // If manager, only show claims from their department
        if (req.user.role === 'manager') {
            const [dept] = await db.query("SELECT id FROM departments WHERE manager_id = ? AND company_id = ?", [req.user.id, req.user.company_id]);
            if (dept.length > 0) {
                q += " WHERE u.department_id = ? AND e.company_id = ?";
                params.push(dept[0].id, req.user.company_id);
            } else {
                // Manager with no department sees nothing
                return res.json([]);
            }
        } else {
            // Admin sees all in company
            q += " WHERE e.company_id = ?";
            params.push(req.user.company_id);
        }
        
        q += " ORDER BY e.created_at DESC";
        
        const [claims] = await db.query(q, params);
        res.json(claims);
    } catch (error) {
        console.error("Error fetching manageable claims:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateClaimStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status update." });
        }
        
        // Validation: Verify this manager can update this claim
        if (req.user.role === 'manager') {
            const [dept] = await db.query("SELECT id FROM departments WHERE manager_id = ? AND company_id = ?", [req.user.id, req.user.company_id]);
            if (dept.length > 0) {
                const [claimOwner] = await db.query(`
                    SELECT u.department_id FROM expense_claims e
                    JOIN users u ON e.employee_id = u.id
                    WHERE e.id = ? AND e.company_id = ?
                `, [id, req.user.company_id]);
                
                if (claimOwner.length === 0 || claimOwner[0].department_id !== dept[0].id) {
                    return res.status(403).json({ message: "You can only approve claims from your own department." });
                }
            } else {
                return res.status(403).json({ message: "You don't manage any department." });
            }
        }
        
        await db.query(`
            UPDATE expense_claims 
            SET status = ?, approved_by = ? 
            WHERE id = ? AND company_id = ?
        `, [status, req.user.id, id, req.user.company_id]);
        
        res.json({ message: `Expense claim ${status} successfully!` });
    } catch (error) {
        console.error("Error updating claim status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
