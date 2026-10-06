import db from '../../database/db.js';
import bcrypt from 'bcrypt';

export const getAllCompanies = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count 
            FROM companies c
        `);
        res.json({ data: rows });
    } catch (error) {
        console.error("Error fetching companies", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const registerCompany = async (req, res) => {
    // Only a Super Admin or public registration flow should hit this
    try {
        const { company_name, subdomain, admin_name, admin_email, admin_password } = req.body;

        if (!company_name || !subdomain || !admin_name || !admin_email || !admin_password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if subdomain exists
        const [existingCompany] = await db.query('SELECT id FROM companies WHERE subdomain = ?', [subdomain]);
        if (existingCompany.length > 0) {
            return res.status(400).json({ message: "Subdomain is already taken." });
        }

        // Create company
        const [companyResult] = await db.query('INSERT INTO companies (name, subdomain) VALUES (?, ?)', [company_name, subdomain]);
        const companyId = companyResult.insertId;

        // Check if email is taken in this company (though technically it's a new company, but good practice)
        // We will insert the admin user
        const hashedPassword = await bcrypt.hash(admin_password, 10);
        const [userResult] = await db.query(
            "INSERT INTO users (name, email, password, role, is_first_login, company_id) VALUES (?, ?, ?, 'admin', FALSE, ?)", 
            [admin_name, admin_email, hashedPassword, companyId]
        );

        res.status(201).json({ message: "Company registered successfully.", company_id: companyId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "A user with this email or subdomain already exists." });
        }
        console.error("Error registering company", error);
        res.status(500).json({ message: "Server error" });
    }
};
