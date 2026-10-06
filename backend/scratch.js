import db from './database/db.js';
import bcrypt from 'bcrypt';

async function test() {
    try {
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        await db.query("INSERT IGNORE INTO users (id, name, email, password, role, is_first_login, company_id) VALUES (9999, 'Super Admin', 'super@platform.com', ?, 'superadmin', FALSE, 1)", [hashedPassword]);
        
        const [rows] = await db.query("SELECT * FROM users WHERE email='super@platform.com'");
        console.log(rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
