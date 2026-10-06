import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';

const adminToken = jwt.sign(
  { id: 1, email: 'admin@company.com', role: 'admin', name: 'Admin', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

describe('Departments API Endpoints', () => {
    it('should fetch all departments', async () => {
        const res = await request(app)
            .get('/api/departments')
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fetch department details', async () => {
        const res = await request(app)
            .get('/api/departments/1') // Assuming Engineering is ID 1
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.department).toBeDefined();
    });

    it('should fail to create a department without name', async () => {
        const res = await request(app)
            .post('/api/departments')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                description: 'A new department'
            });
            
        expect(res.status).toBe(400); // Bad Request
    });
});
