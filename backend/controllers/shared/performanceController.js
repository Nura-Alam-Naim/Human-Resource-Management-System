import db from '../../database/db.js';

// --- MANAGER/ADMIN ROUTES ---

// Create a new goal for an employee
export const createGoal = async (req, res) => {
    try {
        const { employee_id, title, description, target_date } = req.body;
        
        const q = `
            INSERT INTO performance_goals (employee_id, manager_id, title, description, target_date, status, company_id)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `;
        
        await db.query(q, [employee_id, req.user.id, title, description, target_date, req.user.company_id]);
        res.status(201).json({ message: "Goal assigned successfully!" });
    } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update goal (manager/admin)
export const updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, target_date, status } = req.body;
        
        const q = `
            UPDATE performance_goals 
            SET title = ?, description = ?, target_date = ?, status = ?
            WHERE id = ? AND company_id = ?
        `;
        
        await db.query(q, [title, description, target_date, status, id, req.user.company_id]);
        res.json({ message: "Goal updated successfully!" });
    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new appraisal
export const createAppraisal = async (req, res) => {
    try {
        const { employee_id, review_period, rating, comments } = req.body;
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }
        
        const q = `
            INSERT INTO appraisals (employee_id, reviewer_id, review_period, rating, comments, company_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(q, [employee_id, req.user.id, review_period, rating, comments, req.user.company_id]);
        res.status(201).json({ message: "Appraisal submitted successfully!" });
    } catch (error) {
        console.error("Error creating appraisal:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch goals and appraisals for a specific employee (Manager/Admin view)
export const getEmployeePerformance = async (req, res) => {
    try {
        const { employee_id } = req.params;
        
        const [goals] = await db.query(`
            SELECT g.*, u.name as manager_name
            FROM performance_goals g
            JOIN users u ON g.manager_id = u.id
            WHERE g.employee_id = ? AND g.company_id = ?
            ORDER BY g.created_at DESC
        `, [employee_id, req.user.company_id]);
        
        const [appraisals] = await db.query(`
            SELECT a.*, u.name as reviewer_name
            FROM appraisals a
            JOIN users u ON a.reviewer_id = u.id
            WHERE a.employee_id = ? AND a.company_id = ?
            ORDER BY a.created_at DESC
        `, [employee_id, req.user.company_id]);
        
        res.json({ goals, appraisals });
    } catch (error) {
        console.error("Error fetching performance data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- EMPLOYEE ROUTES ---

// Fetch own goals and appraisals
export const getMyPerformance = async (req, res) => {
    try {
        const employee_id = req.user.id;
        
        const [goals] = await db.query(`
            SELECT g.*, u.name as manager_name
            FROM performance_goals g
            JOIN users u ON g.manager_id = u.id
            WHERE g.employee_id = ? AND g.company_id = ?
            ORDER BY g.created_at DESC
        `, [employee_id, req.user.company_id]);
        
        const [appraisals] = await db.query(`
            SELECT a.*, u.name as reviewer_name
            FROM appraisals a
            JOIN users u ON a.reviewer_id = u.id
            WHERE a.employee_id = ? AND a.company_id = ?
            ORDER BY a.created_at DESC
        `, [employee_id, req.user.company_id]);
        
        res.json({ goals, appraisals });
    } catch (error) {
        console.error("Error fetching my performance data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update own goal status
export const updateMyGoalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status update for employee." });
        }
        
        // Ensure the goal actually belongs to the user
        const [goals] = await db.query("SELECT id FROM performance_goals WHERE id = ? AND employee_id = ? AND company_id = ?", [id, req.user.id, req.user.company_id]);
        
        if (goals.length === 0) {
            return res.status(403).json({ message: "Access Denied. You can only update your own goals." });
        }
        
        await db.query("UPDATE performance_goals SET status = ? WHERE id = ? AND company_id = ?", [status, id, req.user.company_id]);
        res.json({ message: "Goal status updated successfully!" });
    } catch (error) {
        console.error("Error updating goal status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
