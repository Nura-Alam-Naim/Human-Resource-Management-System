import request from 'supertest';
import app from '../index.js';
import db from '../database/db.js';
import jwt from 'jsonwebtoken';

const adminToken = jwt.sign(
  { id: 1, email: 'admin@company.com', role: 'admin', name: 'Admin', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

const empToken = jwt.sign(
  { id: 2, email: 'emp@company.com', role: 'employee', name: 'Employee', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

describe('Messages API Endpoints', () => {
    it('should allow employee to send a message to admin pool', async () => {
        const res = await request(app)
            .post('/api/messages/')
            .set('Cookie', [`token=${empToken}`])
            .send({
                receiver_id: null,
                target_role: 'admin',
                message: 'Hello Admins!'
            });
            
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Message sent successfully!");
    });

    it('should fetch conversations for admin', async () => {
        const res = await request(app)
            .get('/api/messages/conversations')
            .set('Cookie', [`token=${adminToken}`]);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fetch chat history', async () => {
        const res = await request(app)
            .get('/api/messages/2')
            .set('Cookie', [`token=${adminToken}`]);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
