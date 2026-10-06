import request from 'supertest';
import app from '../index.js';
import db from '../database/db.js';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Superadmin & Multi-Tenancy APIs', () => {
    let superAdminToken;

    beforeAll(async () => {
        // Create superadmin user for testing
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        await db.query("INSERT IGNORE INTO users (name, email, password, role, is_first_login, company_id) VALUES ('Super Admin', 'supertest_user@platform.com', ?, 'superadmin', FALSE, 1)", [hashedPassword]);

        // Login to get token
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'supertest_user@platform.com', password: 'superadmin123' });

        superAdminToken = res.headers['set-cookie'][0];
    });

    afterAll(async () => {
        await db.query("DELETE FROM users WHERE email = 'supertest_user@platform.com'");
        await db.query("DELETE FROM companies WHERE subdomain = 'testco'");
        await db.end();
    });

    it('should register a new company and its admin', async () => {
        const res = await request(app)
            .post('/api/superadmin/register-company')
            .send({
                company_name: "Test Company Inc",
                subdomain: "testco",
                admin_name: "Test Admin",
                admin_email: "admin@testco.com",
                admin_password: "password123"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Company registered successfully.");
        expect(res.body).toHaveProperty("company_id");

        // Verify company is created
        const [companies] = await db.query("SELECT * FROM companies WHERE subdomain = 'testco'");
        expect(companies.length).toBe(1);

        // Verify admin is created
        const [users] = await db.query("SELECT * FROM users WHERE email = 'admin@testco.com'");
        expect(users.length).toBe(1);
        expect(users[0].company_id).toBe(companies[0].id);
        expect(users[0].role).toBe('admin');
    });

    it('should fetch all companies as superadmin', async () => {
        const res = await request(app)
            .get('/api/superadmin/companies')
            .set('Cookie', superAdminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0]).toHaveProperty('user_count');
    });
});
