import db from '../../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const JWT_SECRET = process.env.JWT_SECRET;

// Generate Token helper
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, is_first_login: user.is_first_login },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
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
                is_first_login: user.is_first_login
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
                is_first_login: updatedUser.is_first_login
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
        const [rows] = await db.query('SELECT id, name, email, role, is_first_login, total_leave_balance FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
