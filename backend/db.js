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
  console.log(`Database '${process.env.DB_NAME}' created/verified.`);
  await tempConnection.end();
} catch (error) {
  console.error("_____Error creating database:", error);
}


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


const initializeDB = async () => {
  try {
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
    console.log("Users table is ready.");
    await db.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL UNIQUE
      );
    `);
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
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        performed_by INT NOT NULL,
        target_user INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    await db.query(`
      INSERT IGNORE INTO leave_types (type_name) VALUES 
      ('Sick Leave'), 
      ('Casual Leave'), 
      ('Annual Leave')
    `);

    const defaultPassword = await bcrypt.hash('12345', 10);
    await db.query(`
      INSERT IGNORE INTO users (name, email, password, role, total_leave_balance, is_first_login) VALUES 
      ('Alice Manager', 'alice@company.com', ?, 'manager', 20, FALSE),
      ('Bob Employee', 'bob@company.com', ?, 'employee', 20, FALSE),
      ('Charlie Admin', 'charlie@company.com', ?, 'manager', 20, FALSE),
      ('Diana Smith', 'diana@company.com', ?, 'employee', 18, FALSE),
      ('Ethan Brown', 'ethan@company.com', ?, 'employee', 15, FALSE),
      ('Fiona Davis', 'fiona@company.com', ?, 'employee', 20, FALSE),
      ('George Wilson', 'george@company.com', ?, 'employee', 12, FALSE),
      ('Hannah Lee', 'hannah@company.com', ?, 'employee', 20, FALSE)
    `, [defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword, defaultPassword]);
    await db.query(`
      INSERT IGNORE INTO leave_requests (id, user_id, type_id, start_date, end_date, reason, status) VALUES
      (1, 2, 1, '2026-07-01', '2026-07-02', 'Feeling unwell, need rest', 'approved'),
      (2, 2, 2, '2026-07-15', '2026-07-16', 'Personal errands to handle', 'pending'),
      (3, 4, 3, '2026-07-10', '2026-07-14', 'Family vacation trip', 'approved'),
      (4, 4, 1, '2026-08-01', '2026-08-01', 'Doctor appointment', 'pending'),
      (5, 5, 2, '2026-07-20', '2026-07-22', 'Attending a wedding', 'approved'),
      (6, 5, 1, '2026-08-05', '2026-08-06', 'Migraine, need recovery time', 'rejected'),
      (7, 6, 3, '2026-08-10', '2026-08-15', 'Annual family reunion', 'pending'),
      (8, 7, 2, '2026-07-05', '2026-07-07', 'Moving to a new apartment', 'approved'),
      (9, 7, 1, '2026-08-12', '2026-08-13', 'Flu symptoms', 'pending'),
      (10, 8, 2, '2026-07-25', '2026-07-25', 'Bank and government office visits', 'approved')
    `);

  } catch (error) {
    console.error("Error initializing tables:", error);
  }
};

await initializeDB();

export default db;
