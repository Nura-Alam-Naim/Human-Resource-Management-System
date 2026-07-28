import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';

// Create a valid token to bypass authMiddleware
const token = jwt.sign(
  { id: 1, email: 'test@company.com', role: 'employee', name: 'Test', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

describe('Leave API Validation Tests', () => {
  it('should return 400 if start date is missing when applying for leave', async () => {
    const res = await request(app)
      .post('/api/user/leaves/apply')
      .set('Cookie', [`token=${token}`])
      .send({
        type_id: 1,
        end_date: '2026-08-10',
        reason: 'Need rest'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Start date is required.');
  });

  it('should return 400 if end date is before start date', async () => {
    const res = await request(app)
      .post('/api/user/leaves/apply')
      .set('Cookie', [`token=${token}`])
      .send({
        type_id: 1,
        start_date: '2026-08-10',
        end_date: '2026-08-01', // End before start
        reason: 'Need rest'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('End date cannot be before start date.');
  });

  it('should return 400 if leave type is invalid', async () => {
    const res = await request(app)
      .post('/api/user/leaves/apply')
      .set('Cookie', [`token=${token}`])
      .send({
        type_id: 99, // Invalid type
        start_date: '2026-08-01',
        end_date: '2026-08-10',
        reason: 'Need rest'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Invalid leave type.');
  });
});
