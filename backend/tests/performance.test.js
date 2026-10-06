import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';

const adminToken = jwt.sign(
  { id: 1, email: 'admin@company.com', role: 'admin', name: 'Admin', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

const empToken = jwt.sign(
  { id: 2, email: 'emp@company.com', role: 'employee', name: 'Employee', is_first_login: 0 },
  process.env.JWT_SECRET || 'supersecretkey'
);

describe('Performance & Appraisals API Endpoints', () => {
    let createdGoalId;

    it('should allow admin/manager to create a goal for an employee', async () => {
        const res = await request(app)
            .post('/api/performance/goals')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                employee_id: 2,
                title: 'Complete React Training',
                description: 'Finish all advanced React tutorials',
                target_date: '2026-12-31'
            });
            
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Goal assigned successfully!");
    });

    it('should allow admin/manager to view employee performance data', async () => {
        const res = await request(app)
            .get('/api/performance/team/2')
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.goals.length).toBeGreaterThan(0);
        
        createdGoalId = res.body.goals[0].id;
    });

    it('should allow employee to fetch their own performance data', async () => {
        const res = await request(app)
            .get('/api/performance/my-performance')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.goals.length).toBeGreaterThan(0);
        expect(res.body.goals[0].title).toBe('Complete React Training');
    });

    it('should allow employee to update their own goal status', async () => {
        const res = await request(app)
            .put(`/api/performance/my-goals/${createdGoalId}/status`)
            .set('Cookie', [`token=${empToken}`])
            .send({
                status: 'in_progress'
            });
            
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Goal status updated successfully!");
    });

    it('should reject invalid goal status update by employee', async () => {
        const res = await request(app)
            .put(`/api/performance/my-goals/${createdGoalId}/status`)
            .set('Cookie', [`token=${empToken}`])
            .send({
                status: 'cancelled' // Employees shouldn't be able to just cancel, only in_progress/completed
            });
            
        expect(res.status).toBe(400);
    });

    it('should allow manager to submit an appraisal', async () => {
        const res = await request(app)
            .post('/api/performance/appraisals')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                employee_id: 2,
                review_period: 'Q3 2026',
                rating: 5,
                comments: 'Outstanding performance!'
            });
            
        expect(res.status).toBe(201);
    });
});
