import db from '../../database/db.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Set up storage for resumes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/resumes/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

export const uploadResume = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/msword' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed!'), false);
        }
    }
});

export const getOpenJobs = async (req, res) => {
    try {
        const q = `
            SELECT j.*, d.name as department_name
            FROM job_postings j
            JOIN departments d ON j.department_id = d.id
            WHERE j.status = 'open' AND j.company_id = ?
            ORDER BY j.created_at DESC
        `;
        const [jobs] = await db.query(q, [req.company_id]);
        res.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const applyForJob = async (req, res) => {
    try {
        const { job_id, first_name, last_name, email, phone, cover_letter } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required." });
        }
        
        const resume_path = req.file.path.replace(/\\/g, '/');
        
        const q = `
            INSERT INTO job_applications 
            (job_id, first_name, last_name, email, phone, resume_path, cover_letter, company_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(q, [job_id, first_name, last_name, email, phone, resume_path, cover_letter, req.company_id]);
        
        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (error) {
        console.error("Error submitting application:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
