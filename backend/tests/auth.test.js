import request from 'supertest';
import app from '../index.js';

describe('Auth API Validation Tests', () => {
  it('should return 400 if email is missing during login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Email is required.');
  });

  it('should return 400 if email is invalid during login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: 'password123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Please provide a valid email address.');
  });

  it('should return 400 if password is missing during login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@company.com' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Password is required.');
  });
});
