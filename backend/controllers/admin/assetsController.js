import db from '../../database/db.js';

// --- ADMIN ROUTES ---

export const getAssets = async (req, res) => {
    try {
        const [assets] = await db.query(`
            SELECT a.*, u.name as assigned_to_name, u.email as assigned_to_email
            FROM assets a
            LEFT JOIN users u ON a.assigned_to = u.id
            WHERE a.company_id = ?
            ORDER BY a.created_at DESC
        `, [req.user.company_id]);
        res.json(assets);
    } catch (error) {
        console.error("Error fetching assets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createAsset = async (req, res) => {
    try {
        const { asset_tag, name, category, status, assigned_to, assigned_date, notes } = req.body;
        
        // Validate unique asset_tag within the same company
        const [existing] = await db.query("SELECT id FROM assets WHERE asset_tag = ? AND company_id = ?", [asset_tag, req.user.company_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Asset tag must be unique within your company." });
        }
        
        const q = `
            INSERT INTO assets (asset_tag, name, category, status, assigned_to, assigned_date, notes, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(q, [
            asset_tag, 
            name, 
            category || 'other', 
            status || 'available', 
            assigned_to || null, 
            assigned_date || null, 
            notes || '',
            req.user.company_id
        ]);
        
        res.status(201).json({ message: "Asset added successfully!" });
    } catch (error) {
        console.error("Error adding asset:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { asset_tag, name, category, status, assigned_to, assigned_date, notes } = req.body;
        
        // Validate unique asset_tag for other assets within company
        const [existing] = await db.query("SELECT id FROM assets WHERE asset_tag = ? AND id != ? AND company_id = ?", [asset_tag, id, req.user.company_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Asset tag must be unique within your company." });
        }
        
        const q = `
            UPDATE assets
            SET asset_tag = ?, name = ?, category = ?, status = ?, assigned_to = ?, assigned_date = ?, notes = ?
            WHERE id = ? AND company_id = ?
        `;
        
        await db.query(q, [
            asset_tag, 
            name, 
            category, 
            status, 
            assigned_to || null, 
            assigned_date || null, 
            notes || '', 
            id,
            req.user.company_id
        ]);
        
        res.json({ message: "Asset updated successfully!" });
    } catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        await db.query("DELETE FROM assets WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
        res.json({ message: "Asset deleted successfully!" });
    } catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- EMPLOYEE ROUTE ---

export const getMyAssets = async (req, res) => {
    try {
        const [assets] = await db.query(`
            SELECT * FROM assets 
            WHERE assigned_to = ? AND company_id = ?
            ORDER BY assigned_date DESC
        `, [req.user.id, req.user.company_id]);
        
        res.json(assets);
    } catch (error) {
        console.error("Error fetching my assets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
