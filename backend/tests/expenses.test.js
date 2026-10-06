import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminToken = jwt.sign(
  { id: 1, email: 'admin@company.com', role: 'admin', name: 'Admin', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

const empToken = jwt.sign(
  { id: 999, email: 'emp999@company.com', role: 'employee', name: 'Employee', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

// We assume user 1 is admin. We will create user 999 in beforeAll.

describe('Expense Claims API Endpoints', () => {
    let createdClaimId;
    const mockFilePath = path.join(__dirname, 'mock_receipt.txt');

    beforeAll(async () => {
        // Create a dummy file for upload testing
        fs.writeFileSync(mockFilePath, 'dummy receipt content');
        
        // Ensure user 999 exists and belongs to dept 1
        await db.query(`
            INSERT IGNORE INTO users (id, name, email, password, role, department_id, is_first_login) 
            VALUES (999, 'Emp999', 'emp999@company.com', 'hashed', 'employee', 1, 0)
        `);
    });

    afterAll(async () => {
        // Clean up dummy file
        if (fs.existsSync(mockFilePath)) {
            fs.unlinkSync(mockFilePath);
        }
    });

    it('should allow employee to submit an expense claim without receipt', async () => {
        const res = await request(app)
            .post('/api/expenses/submit')
            .set('Cookie', [`token=${empToken}`])
            .send({
                date: '2026-10-01',
                amount: '45.50',
                category: 'meals',
                description: 'Client lunch meeting'
            });
            
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Expense claim submitted successfully!");
    });

    it('should allow employee to submit an expense claim WITH receipt', async () => {
        const res = await request(app)
            .post('/api/expenses/submit')
            .set('Cookie', [`token=${empToken}`])
            .field('date', '2026-10-02')
            .field('amount', '120.00')
            .field('category', 'travel')
            .field('description', 'Flight to conference')
            .attach('receipt', mockFilePath);
            
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Expense claim submitted successfully!");
    });

    it('should allow employee to fetch their own claims', async () => {
        const res = await request(app)
            .get('/api/expenses/my-claims')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        
        // Grab the ID of one of the pending claims
        const mealsClaim = res.body.find(c => c.category === 'meals');
        if (mealsClaim) {
            createdClaimId = mealsClaim.id;
        } else {
            createdClaimId = res.body[0].id; // Fallback
        }
    });

    it('should block employee from fetching manageable claims', async () => {
        const res = await request(app)
            .get('/api/expenses/manage')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(403);
    });

    it('should allow admin to fetch all manageable claims', async () => {
        const res = await request(app)
            .get('/api/expenses/manage')
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        
        const claim = res.body.find(c => c.id === createdClaimId);
        expect(claim).toBeDefined();
        expect(claim.status).toBe('pending');
    });

    it('should allow admin to approve a claim', async () => {
        const res = await request(app)
            .put(`/api/expenses/${createdClaimId}/status`)
            .set('Cookie', [`token=${adminToken}`])
            .send({
                status: 'approved'
            });
            
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Expense claim approved successfully!");
    });

    it('should reflect approved status in employee claims', async () => {
        const res = await request(app)
            .get('/api/expenses/my-claims')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(200);
        const claim = res.body.find(c => c.id === createdClaimId);
        expect(claim).toBeDefined();
        if (claim) {
            expect(claim.status).toBe('approved');
            expect(claim.approved_by_name).toBeDefined();
        }
    });
});
