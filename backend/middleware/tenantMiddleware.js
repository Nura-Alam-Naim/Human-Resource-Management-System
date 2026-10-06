import db from '../database/db.js';

export const resolveTenant = async (req, res, next) => {
    try {
        const subdomain = req.headers['x-subdomain'];
        if (!subdomain) {
            return res.status(400).json({ message: "Subdomain is required for public endpoints." });
        }

        const [companies] = await db.query('SELECT id FROM companies WHERE subdomain = ?', [subdomain]);
        
        if (companies.length === 0) {
            return res.status(404).json({ message: "Company not found." });
        }

        req.company_id = companies[0].id;
        next();
    } catch (error) {
        console.error("Tenant resolution error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
