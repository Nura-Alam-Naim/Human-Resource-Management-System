import db from '../../database/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const JWT_SECRET = process.env.JWT_SECRET;

// Generate Token helper
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            name: user.name, 
            is_first_login: user.is_first_login,
            company_id: user.company_id
        },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

export const register = async (req, res) => {
    try {
        const { companyName, subdomain, adminName, email, password } = req.body;

        if (!companyName || !subdomain || !adminName || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if subdomain exists
        const [existingCompany] = await db.query('SELECT id FROM companies WHERE subdomain = ?', [subdomain]);
        if (existingCompany.length > 0) {
            return res.status(400).json({ message: "Workspace URL (subdomain) is already taken." });
        }

        // Check if email exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // Create company
        const [companyResult] = await db.query(
            'INSERT INTO companies (name, subdomain) VALUES (?, ?)',
            [companyName, subdomain]
        );
        const companyId = companyResult.insertId;

        // Create admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password, role, is_first_login, company_id) VALUES (?, ?, ?, ?, FALSE, ?)',
            [adminName, email, hashedPassword, 'admin', companyId]
        );

        res.status(201).json({ message: "Registration successful!", subdomain });
    } catch (error) {
        console.error("Registration error", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, subdomain } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        let query = 'SELECT u.* FROM users u';
        let params = [email];
        
        if (subdomain) {
            query += ' JOIN companies c ON u.company_id = c.id WHERE u.email = ? AND c.subdomain = ?';
            params.push(subdomain);
        } else {
            query += ' WHERE u.email = ?';
        }

        const [rows] = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = generateToken(user);

        // Set the JWT as an HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_first_login: user.is_first_login,
                profile_picture: user.profile_picture,
                company_id: user.company_id
            }
        });
    } catch (error) {
        console.error("Login error", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
    res.json({ message: "Logged out successfully" });
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = rows[0];

        // If old password is provided, verify it. 
        // If they are setting it for the first time, oldPassword might be the temp one.
        if (oldPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect current password." });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query('UPDATE users SET password = ?, is_first_login = FALSE WHERE id = ?', [hashedPassword, userId]);

        // Generate new token since is_first_login is now false
        const [updatedRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedRows[0];

        const token = generateToken(updatedUser);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            message: "Password changed successfully.",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                is_first_login: updatedUser.is_first_login,
                profile_picture: updatedUser.profile_picture
            }
        });
    } catch (error) {
        console.error("Change password error", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT id, name, email, role, is_first_login, total_leave_balance, profile_picture, company_id FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];
        
        // Also get company details
        const [companyRows] = await db.query('SELECT name as company_name, subdomain FROM companies WHERE id = ?', [user.company_id]);
        if (companyRows.length > 0) {
            user.company_name = companyRows[0].company_name;
            user.subdomain = companyRows[0].subdomain;
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
