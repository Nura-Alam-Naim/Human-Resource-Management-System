import db from '../../db.js';
import multer from 'multer';
import path from 'path';

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

export const upload = multer({ storage: storage });

export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const { request_id, doc_type } = req.body;
        const userId = req.user.id;
        const filePath = req.file.path;
        const fileName = req.file.originalname;

        const q = "INSERT INTO documents (user_id, request_id, file_name, file_path, doc_type) VALUES (?, ?, ?, ?, ?)";
        await db.query(q, [userId, request_id || null, fileName, filePath, doc_type || 'General']);

        res.status(201).json({ message: "Document uploaded successfully!", path: filePath });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query("SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC", [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const userId = req.user.id;

        const [result] = await db.query("DELETE FROM documents WHERE id = ? AND user_id = ?", [documentId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Document not found or access denied." });
        }
        res.json({ message: "Document deleted successfully." });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded." });
        }
        
        const userId = req.user.id;
        const filePath = req.file.path; // e.g., 'uploads/16239123-file.png'

        // Update the users table
        await db.query("UPDATE users SET profile_picture = ? WHERE id = ?", [filePath, userId]);
        
        res.status(200).json({ message: "Profile picture updated successfully!", profile_picture: filePath });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
