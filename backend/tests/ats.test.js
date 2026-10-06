import request from 'supertest';
import app from '../index.js';
import db from '../database/db.js';

import jwt from 'jsonwebtoken';

// Create a valid token to bypass authMiddleware
const adminToken = jwt.sign(
  { id: 1, email: 'admin@company.com', role: 'admin', name: 'Admin', is_first_login: 0, company_id: 1 },
  process.env.JWT_SECRET || 'supersecretkey'
);

describe('ATS & Recruitment API Endpoints', () => {
    let createdJobId;

    afterAll(async () => {
        // Cleanup test jobs created
        if (createdJobId) {
            await db.query("DELETE FROM job_postings WHERE id = ?", [createdJobId]);
        }
    });

    it('should create a new job posting if admin', async () => {
        const [depts] = await db.query("SELECT id FROM departments LIMIT 1");
        const deptId = depts[0].id;

        const res = await request(app)
            .post('/api/admin/ats/jobs')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                title: 'Test Software Engineer',
                department_id: deptId,
                employment_type: 'full-time',
                location: 'Remote',
                description: 'A test job description.',
                requirements: 'Test requirements',
                status: 'open'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Job posted successfully!");
        
        // Fetch it back to get the ID for cleanup
        const fetchRes = await request(app)
            .get('/api/admin/ats/jobs')
            .set('Cookie', [`token=${adminToken}`]);
            
        createdJobId = fetchRes.body[0].id;
    });

    it('should fetch open jobs publicly', async () => {
        const res = await request(app)
            .get('/api/careers/jobs')
            .set('X-Subdomain', 'default');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // The newly created job should be in the public list
        const found = res.body.find(j => j.id === createdJobId);
        expect(found).toBeDefined();
        expect(found.title).toBe('Test Software Engineer');
    });

    it('should fail to apply for a job without a resume', async () => {
        const res = await request(app)
            .post('/api/careers/apply')
            .set('X-Subdomain', 'default')
            .send({
                job_id: createdJobId,
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '1234567890'
            });

        // Should return 400 because multer field 'resume' is missing
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Resume file is required.");
    });
    
    // Note: Testing actual file uploads via supertest requires .attach(), 
    // which works but is slightly out of scope for a quick sanity check. 
    // The missing file error proves the endpoint is hooked up properly.
});
