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

describe('Assets Management API Endpoints', () => {
    let createdAssetId;

    it('should allow admin to create an asset', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                asset_tag: 'LAP-001',
                name: 'MacBook Pro M2',
                category: 'laptop',
                status: 'assigned',
                assigned_to: 2,
                assigned_date: '2026-08-01',
                notes: 'Brand new'
            });
            
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Asset added successfully!");
    });

    it('should prevent duplicate asset tags', async () => {
        const res = await request(app)
            .post('/api/assets')
            .set('Cookie', [`token=${adminToken}`])
            .send({
                asset_tag: 'LAP-001',
                name: 'Another Laptop',
                category: 'laptop'
            });
            
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Asset tag must be unique.");
    });

    it('should allow admin to fetch all assets', async () => {
        const res = await request(app)
            .get('/api/assets')
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        
        createdAssetId = res.body.find(a => a.asset_tag === 'LAP-001').id;
    });

    it('should block non-admins from fetching all assets', async () => {
        const res = await request(app)
            .get('/api/assets')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(403);
    });

    it('should allow employee to fetch their assigned assets', async () => {
        const res = await request(app)
            .get('/api/assets/my-assets')
            .set('Cookie', [`token=${empToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].asset_tag).toBe('LAP-001');
    });

    it('should allow admin to update an asset', async () => {
        const res = await request(app)
            .put(`/api/assets/${createdAssetId}`)
            .set('Cookie', [`token=${adminToken}`])
            .send({
                asset_tag: 'LAP-001-REV',
                name: 'MacBook Pro M2 (Rev)',
                category: 'laptop',
                status: 'maintenance',
                assigned_to: null,
                assigned_date: null
            });
            
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Asset updated successfully!");
    });

    it('should allow admin to delete an asset', async () => {
        const res = await request(app)
            .delete(`/api/assets/${createdAssetId}`)
            .set('Cookie', [`token=${adminToken}`]);
            
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Asset deleted successfully!");
    });
});
