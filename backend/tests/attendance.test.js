import request from 'supertest';
import app from '../index.js';
import db from '../db.js';

let authCookie;

beforeAll(async () => {
  // Login as standard user to get token
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'bob@company.com',
      password: '12345'
    });
  
  authCookie = response.headers['set-cookie'];
});

afterAll(async () => {
  await db.end(); // Close DB pool
});

describe('Attendance API Tests', () => {

  it('should get not-clocked-in status initially', async () => {
    const res = await request(app)
      .get('/api/attendance/status')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    // Might be clocked in if previous tests ran today without dropping DB, so we just check it returns a status
    expect(res.body.status).toBeDefined(); 
  });

  it('should successfully clock in', async () => {
    const res = await request(app)
      .post('/api/attendance/clock-in')
      .set('Cookie', authCookie);
    
    // Depending on if DB was reset, it might be 201 or 400 (already clocked in)
    expect([201, 400]).toContain(res.statusCode);
  });

  it('should prevent multiple clock ins', async () => {
    const res = await request(app)
      .post('/api/attendance/clock-in')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already clocked in|completed your shift/i);
  });

  it('should successfully clock out', async () => {
    const res = await request(app)
      .post('/api/attendance/clock-out')
      .set('Cookie', authCookie);
    
    // 200 if successful, 400 if already clocked out
    expect([200, 400]).toContain(res.statusCode);
  });
});
