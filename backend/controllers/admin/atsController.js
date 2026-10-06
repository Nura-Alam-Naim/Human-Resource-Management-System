import db from '../../database/db.js';
import nodemailer from 'nodemailer';

// Configure Nodemailer (you can replace with real SMTP details later)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email', // Using ethereal for testing
    port: 587,
    auth: {
        user: 'mylene.muller22@ethereal.email', // Dummy ethereal account
        pass: '6sWgA12sR6F2TfBtz1' 
    }
});

export const getJobs = async (req, res) => {
    try {
        const q = `
            SELECT j.*, d.name as department_name, u.name as creator_name
            FROM job_postings j
            JOIN departments d ON j.department_id = d.id
            JOIN users u ON j.created_by = u.id
            WHERE j.company_id = ?
            ORDER BY j.created_at DESC
        `;
        const [jobs] = await db.query(q, [req.user.company_id]);
        res.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createJob = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can post jobs." });
        }
        
        const { title, department_id, employment_type, location, description, requirements, status } = req.body;
        
        const q = `
            INSERT INTO job_postings 
            (title, department_id, employment_type, location, description, requirements, status, created_by, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(q, [title, department_id, employment_type, location, description, requirements, status || 'open', req.user.id, req.user.company_id]);
        
        res.status(201).json({ message: "Job posted successfully!" });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateJob = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can update jobs." });
        }
        
        const jobId = req.params.id;
        const { title, department_id, employment_type, location, description, requirements, status } = req.body;
        
        const q = `
            UPDATE job_postings 
            SET title = ?, department_id = ?, employment_type = ?, location = ?, description = ?, requirements = ?, status = ?
            WHERE id = ? AND company_id = ?
        `;
        
        await db.query(q, [title, department_id, employment_type, location, description, requirements, status, jobId, req.user.company_id]);
        
        res.json({ message: "Job updated successfully!" });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteJob = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can delete jobs." });
        }
        await db.query("DELETE FROM job_postings WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
        res.json({ message: "Job deleted successfully!" });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getApplications = async (req, res) => {
    try {
        // We can fetch all applications or filter by jobId
        let q = `
            SELECT a.*, j.title as job_title, j.department_id, d.name as department_name
            FROM job_applications a
            JOIN job_postings j ON a.job_id = j.id
            JOIN departments d ON j.department_id = d.id
            WHERE j.company_id = ?
        `;
        const params = [req.user.company_id];
        
        if (req.query.jobId) {
            q += " AND a.job_id = ?";
            params.push(req.query.jobId);
        }
        
        q += " ORDER BY a.applied_at DESC";
        
        const [applications] = await db.query(q, params);
        res.json(applications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Get candidate email before updating
        const [apps] = await db.query(`
            SELECT a.email, a.first_name, a.last_name, a.job_id 
            FROM job_applications a 
            JOIN job_postings j ON a.job_id = j.id 
            WHERE a.id = ? AND j.company_id = ?
        `, [id, req.user.company_id]);
        if (apps.length === 0) {
            return res.status(404).json({ message: "Application not found." });
        }
        
        const candidate = apps[0];
        
        // Get job details
        const [jobs] = await db.query("SELECT title FROM job_postings WHERE id = ?", [candidate.job_id]);
        const jobTitle = jobs[0]?.title || 'the position';
        
        await db.query("UPDATE job_applications SET status = ? WHERE id = ?", [status, id]);
        
        // Send email notification based on status
        let subject = '';
        let html = '';
        
        if (status === 'interviewing') {
            subject = `Update on your application for ${jobTitle}`;
            html = `<p>Dear ${candidate.first_name},</p><p>We are pleased to inform you that we would like to invite you for an interview for the <b>${jobTitle}</b> position.</p><p>Our team will reach out to you shortly with scheduling details.</p><p>Best regards,<br>HR Team</p>`;
        } else if (status === 'rejected') {
            subject = `Update on your application for ${jobTitle}`;
            html = `<p>Dear ${candidate.first_name},</p><p>Thank you for taking the time to apply for the <b>${jobTitle}</b> position. After careful consideration, we have decided not to move forward with your application at this time.</p><p>We wish you the best of luck in your job search.</p><p>Best regards,<br>HR Team</p>`;
        } else if (status === 'offered') {
            subject = `Job Offer: ${jobTitle}`;
            html = `<p>Dear ${candidate.first_name},</p><p>Congratulations! We are thrilled to offer you the <b>${jobTitle}</b> position.</p><p>We will be sending over the official offer letter and details shortly.</p><p>Best regards,<br>HR Team</p>`;
        }
        
        if (subject && html) {
            try {
                await transporter.sendMail({
                    from: '"HR Recruitment" <hr@company.com>',
                    to: candidate.email,
                    subject: subject,
                    html: html
                });
                console.log(`Email sent to ${candidate.email} for status ${status}`);
            } catch (emailErr) {
                console.error("Failed to send email, but status updated:", emailErr);
            }
        }
        
        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
