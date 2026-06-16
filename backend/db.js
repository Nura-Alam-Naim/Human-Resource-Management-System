import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

try {
  const tempConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
  console.log(`✅ Database '${process.env.DB_NAME}' created/verified.`);
  await tempConnection.end();
} catch (error) {
  console.error("❌ Error creating database:", error);
}


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 3. Initialize Tables and Dummy Data
const initializeDB = async () => {
  try {
    // Create 'users' table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('employee', 'manager') DEFAULT 'employee',
        total_leave_balance INT DEFAULT 20,
        is_first_login BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Users table is ready.");

    // Create 'leave_types' table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL UNIQUE
      );
    `);
    console.log("✅ Leave Types table is ready.");

    // Create 'leave_requests' table
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES leave_types(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Leave Requests table is ready.");

    // Inject Dummy Data
    await db.query(`
      INSERT IGNORE INTO leave_types (type_name) VALUES 
      ('Sick Leave'), 
      ('Casual Leave'), 
      ('Annual Leave')
    `);

    const defaultPassword = await bcrypt.hash('password123', 10);
    await db.query(`
      INSERT IGNORE INTO users (name, email, password, role, total_leave_balance, is_first_login) VALUES 
      ('Alice Manager', 'alice@company.com', ?, 'manager', 20, FALSE),
      ('Bob Employee', 'bob@company.com', ?, 'employee', 20, FALSE)
    `, [defaultPassword, defaultPassword]);
    console.log("✅ Dummy data injected!");

  } catch (error) {
    console.error("❌ Error initializing tables:", error);
  }
};

await initializeDB();

export default db;
