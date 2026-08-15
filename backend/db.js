import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

try {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = { rejectUnauthorized: false };
  }

  const tempConnection = await mysql.createConnection(dbConfig);
  await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
  console.log(`Database '${process.env.DB_NAME}' created/verified.`);
  await tempConnection.end();
} catch (error) {
  console.error("_____Error creating database:", error);
}


const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const db = mysql.createPool(poolConfig);


const initializeDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('employee', 'manager', 'admin') DEFAULT 'employee',
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
      ('Alice Manager', 'alice@company.com', ?, 'manager', 20, TRUE),
      ('Bob Employee', 'bob@company.com', ?, 'employee', 20, TRUE),
      ('Charlie Admin', 'charlie@company.com', ?, 'admin', 20, TRUE),
      ('Diana Smith', 'diana@company.com', ?, 'employee', 18, TRUE),
      ('Ethan Brown', 'ethan@company.com', ?, 'employee', 15, TRUE),
      ('Fiona Davis', 'fiona@company.com', ?, 'employee', 20, TRUE),
      ('George Wilson', 'george@company.com', ?, 'employee', 12, TRUE),
      ('Hannah Lee', 'hannah@company.com', ?, 'employee', 20, TRUE)
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

    // --- HRMS PHASE 1 MIGRATION ---

    // --- HRMS PHASE 1 MIGRATION ---
    // Check if employee_id column exists, if not, we need to run the Phase 1 migration
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'employee_id'");
    if (columns.length === 0) {
      console.log("Upgrading database schema for HRMS Phase 1 (Departments & Designations)...");
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          manager_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS designations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          department_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
        );
      `);

      await db.query(`
        ALTER TABLE users 
        ADD COLUMN employee_id VARCHAR(50) UNIQUE AFTER id,
        ADD COLUMN department_id INT AFTER role,
        ADD COLUMN designation_id INT AFTER department_id;
      `);

      await db.query(`
        ALTER TABLE users
        ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        ADD FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL;
      `);

      await db.query(`
        ALTER TABLE departments
        ADD FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
      `);
      
      // Seed initial HRMS Phase 1 data
      await db.query(`INSERT IGNORE INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Human Resources'), (3, 'Sales')`);
      await db.query(`INSERT IGNORE INTO designations (id, title, department_id) VALUES 
        (1, 'Software Engineer', 1), 
        (2, 'Engineering Manager', 1), 
        (3, 'HR Manager', 2), 
        (4, 'Sales Representative', 3),
        (5, 'Frontend Developer', 1),
        (6, 'Backend Developer', 1),
        (7, 'Fullstack Developer', 1),
        (8, 'DevOps Engineer', 1),
        (9, 'QA Tester', 1),
        (10, 'UI/UX Designer', 1),
        (11, 'Scrum Master', 1),
        (12, 'Product Manager', 1),
        (13, 'System Architect', 1),
        (14, 'Database Admin', 1),
        (15, 'HR Generalist', 2),
        (16, 'Recruiter', 2),
        (17, 'Payroll Specialist', 2),
        (18, 'Employee Relations', 2),
        (19, 'Account Executive', 3),
        (20, 'Sales Manager', 3),
        (21, 'Business Development', 3)
      `);
      
      // Update existing seed users to fit the new HRMS structure
      // We assume user 1 (Alice) manages Engineering, user 3 (Charlie) manages HR
      await db.query(`UPDATE departments SET manager_id = 1 WHERE id = 1`); 
      await db.query(`UPDATE departments SET manager_id = 3 WHERE id = 2`); 
      
      // Assign everyone an Employee ID based on their database ID
      await db.query(`UPDATE users SET employee_id = CONCAT('EMP-', LPAD(id, 3, '0'))`);
      
      // Assign roles
      await db.query(`UPDATE users SET department_id = 1, designation_id = 1 WHERE role = 'employee'`);
      await db.query(`UPDATE users SET department_id = 1, designation_id = 2 WHERE id = 1`);
      await db.query(`UPDATE users SET department_id = 2, designation_id = 3 WHERE id = 3`);
      
      console.log("HRMS Phase 1 Migration Complete.");
    }

    // --- HRMS PHASE 2 MIGRATION (Attendance) ---
    const [tables] = await db.query("SHOW TABLES LIKE 'attendance'");
    if (tables.length === 0) {
      console.log("Upgrading database schema for HRMS Phase 2 (Time & Attendance)...");
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          date DATE NOT NULL,
          clock_in DATETIME NOT NULL,
          clock_out DATETIME,
          status ENUM('present', 'absent', 'half-day', 'on-leave') DEFAULT 'present',
          notes VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_date (user_id, date)
        );
      `);
      
      console.log("HRMS Phase 2 Migration Complete. 'attendance' table created.");
    }

    // --- HRMS PHASE 3 MIGRATION (Advanced Leaves) ---
    const [holidaysTable] = await db.query("SHOW TABLES LIKE 'public_holidays'");
    if (holidaysTable.length === 0) {
      console.log("Upgrading database schema for HRMS Phase 3 (Advanced Leaves & Approvals)...");
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS public_holidays (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date DATE NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Update existing leave requests so they don't break
      await db.query(`
        ALTER TABLE leave_requests
        MODIFY COLUMN status ENUM('pending', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled') DEFAULT 'pending_manager'
      `);

      await db.query(`
        INSERT IGNORE INTO public_holidays (date, name) VALUES 
        ('2026-01-01', 'New Year\\'s Day'),
        ('2026-12-25', 'Christmas Day')
      `);

      console.log("HRMS Phase 3 Migration Complete. 'public_holidays' created.");
    }

    // --- HRMS PHASE 4 MIGRATION (Mock Data Seeding) ---
    const [[{ userCount }]] = await db.query("SELECT COUNT(*) as userCount FROM users");
    if (userCount < 5) {
      console.log("Seeding database with mock data for testing and visibility...");
      const mockPassword = await bcrypt.hash('12345', 10);
      
      // Insert mock users
      await db.query(`
        INSERT INTO users (name, email, password, role, department_id, designation_id, total_leave_balance) VALUES 
        ('Alice Smith', 'alice@example.com', ?, 'manager', 1, 2, 20),
        ('Bob Jones', 'bob@example.com', ?, 'manager', 2, 3, 20),
        ('Charlie Brown', 'charlie@example.com', ?, 'employee', 1, 1, 15),
        ('Diana Prince', 'diana@example.com', ?, 'employee', 1, 1, 15),
        ('Eve Adams', 'eve@example.com', ?, 'employee', 2, 1, 15),
        ('Frank Wright', 'frank@example.com', ?, 'employee', 2, 1, 15)
      `, [mockPassword, mockPassword, mockPassword, mockPassword, mockPassword, mockPassword]);
      
      await db.query(`UPDATE users SET employee_id = CONCAT('EMP-', LPAD(id, 3, '0')) WHERE employee_id IS NULL`);
      
      // Get the mock user IDs
      const [mockUsers] = await db.query("SELECT id FROM users WHERE email LIKE '%@example.com'");
      
      // Insert mock attendance for the past 14 days
      let attendanceData = [];
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Skip weekends for realistic data
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const dateStr = d.toISOString().split('T')[0];
        
        for (const user of mockUsers) {
          // Random clock in between 08:30 and 09:30
          const clockInHour = 8;
          const clockInMin = 30 + Math.floor(Math.random() * 60);
          const clockIn = `${dateStr} ${clockInHour.toString().padStart(2, '0')}:${clockInMin.toString().padStart(2, '0')}:00`;
          
          // Random clock out between 17:00 and 18:00
          const clockOutHour = 17;
          const clockOutMin = Math.floor(Math.random() * 60);
          const clockOut = `${dateStr} ${clockOutHour.toString().padStart(2, '0')}:${clockOutMin.toString().padStart(2, '0')}:00`;
          
          attendanceData.push([user.id, dateStr, clockIn, clockOut, 'present']);
        }
      }
      
      if (attendanceData.length > 0) {
        await db.query(`
          INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status)
          VALUES ?
        `, [attendanceData]);
      }
      
      // Insert mock leave requests
      await db.query(`
        INSERT INTO leave_requests (user_id, type_id, start_date, end_date, reason, status) VALUES 
        (?, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Vacation trip', 'approved'),
        (?, 2, DATE_ADD(CURDATE(), INTERVAL -10 DAY), DATE_ADD(CURDATE(), INTERVAL -9 DAY), 'Feeling sick', 'rejected'),
        (?, 1, DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Family event', 'pending'),
        (?, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Personal matters', 'approved')
      `, [mockUsers[2]?.id || 3, mockUsers[3]?.id || 4, mockUsers[4]?.id || 5, mockUsers[5]?.id || 6]);
      
      console.log("Mock data seeding complete.");
    }

    const [documentsTable] = await db.query("SHOW TABLES LIKE 'documents'");
    if (documentsTable.length === 0) {
      console.log("Upgrading database schema for HRMS Phase 5 (Employee Profiles & Documents)...");
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          request_id INT,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          doc_type VARCHAR(100) DEFAULT 'General',
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (request_id) REFERENCES leave_requests(id) ON DELETE CASCADE
        );
      `);

      const [profilePicCol] = await db.query("SHOW COLUMNS FROM users LIKE 'profile_picture'");
      if (profilePicCol.length === 0) {
        await db.query("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL;");
      }

      console.log("HRMS Phase 5 Migration Complete. 'documents' created and profile_picture added.");
    }

    // --- HRMS PHASE 6 MIGRATION (Payroll & Salary) ---
    const [payslipsTable] = await db.query("SHOW TABLES LIKE 'payslips'");
    if (payslipsTable.length === 0) {
      console.log("Upgrading database schema for HRMS Phase 6 (Payroll & Salary)...");
      
      const [baseSalaryCol] = await db.query("SHOW COLUMNS FROM users LIKE 'base_salary'");
      if (baseSalaryCol.length === 0) {
        await db.query("ALTER TABLE users ADD COLUMN base_salary DECIMAL(10,2) DEFAULT 0.00;");
        // Give some seed data for base salary
        await db.query("UPDATE users SET base_salary = 5000.00 WHERE role = 'employee'");
        await db.query("UPDATE users SET base_salary = 8000.00 WHERE role = 'manager'");
        await db.query("UPDATE users SET base_salary = 10000.00 WHERE role = 'admin'");
      }

      await db.query(`
        CREATE TABLE IF NOT EXISTS payslips (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          month INT NOT NULL,
          year INT NOT NULL,
          base_salary DECIMAL(10,2) NOT NULL,
          days_worked INT NOT NULL,
          gross_pay DECIMAL(10,2) NOT NULL,
          deductions DECIMAL(10,2) DEFAULT 0.00,
          net_pay DECIMAL(10,2) NOT NULL,
          status ENUM('draft', 'generated', 'paid') DEFAULT 'generated',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_payslip (user_id, month, year)
        );
      `);

      console.log("HRMS Phase 6 Migration Complete. 'payslips' created and base_salary added.");
    }

  } catch (error) {
    console.error("Error initializing tables:", error);
  }
};

await initializeDB();

export default db;
