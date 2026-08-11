import request from 'supertest';
import app from '../index.js';
import db from '../db.js';

let authCookie;

beforeAll(async () => {
  // Login as admin/manager to get the token for HRMS operations
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'alice@company.com',
      password: '12345'
    });
  
  authCookie = response.headers['set-cookie'];
});

afterAll(async () => {
  await db.end(); // Close DB pool
});

describe('HRMS Phase 1 API Tests (Departments & Designations)', () => {
  let createdDepartmentId;

  it('should get all departments successfully', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(3); // Based on our seed data
  });

  it('should create a new department', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Cookie', authCookie)
      .send({
        name: 'Marketing Test',
        manager_id: 1 // Alice
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.departmentId).toBeDefined();
    createdDepartmentId = res.body.departmentId;
  });

  it('should create a new designation within the new department', async () => {
    const res = await request(app)
      .post('/api/designations')
      .set('Cookie', authCookie)
      .send({
        title: 'Marketing Lead Test',
        department_id: createdDepartmentId
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.designationId).toBeDefined();
  });

  it('should fetch designations by department id', async () => {
    const res = await request(app)
      .get(`/api/designations/department/${createdDepartmentId}`)
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body[0].title).toBe('Marketing Lead Test');
  });
});
