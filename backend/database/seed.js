/**
 * ============================================================================
 *  HRMS Demo Data Seeder
 * ============================================================================
 *
 *  Populates the database with realistic, deterministic dummy data so every
 *  module of the portal can be tested manually.
 *
 *  Usage (from the /backend directory):
 *    npm run seed          → seed once (skips if demo data already exists)
 *    npm run seed:fresh    → wipe previous demo data and re-seed from scratch
 *
 *  What gets created:
 *    • 3 tenant companies (Default Company, Acme Corporation, Globex Industries)
 *    • 1 Super Admin, plus an Admin, Managers and Employees for every tenant
 *    • Departments, designations, leave types and public holidays
 *    • ~30 days of attendance, leave requests in every status, payslips,
 *      chat conversations, job postings + candidates + interviews,
 *      performance goals + appraisals, assets, expense claims,
 *      transfer / headcount requests and activity logs.
 *
 *  Every account uses the password: 12345  (first-login prompt disabled)
 *
 *  Importing ./db.js runs the schema bootstrap/migrations first, so this
 *  script works against a completely empty database.
 * ============================================================================
 */

import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRESH = process.argv.includes('--fresh');
const DEMO_PASSWORD = '12345';
const SUPER_ADMIN = { name: 'Super Admin', email: 'superadmin@hrms.dev' };

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers (same data on every run)
// ---------------------------------------------------------------------------
let rngState = 20260101;
const rand = () => {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------------------
// Date helpers (local time — avoids UTC shifting from toISOString)
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDateTime = (d) => `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const at = (d, h, m) => { const x = new Date(d); x.setHours(h, m, randInt(0, 59), 0); return x; };
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------
const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Annual Leave'];

const HOLIDAYS = [
  ['2026-01-01', "New Year's Day"],
  ['2026-02-21', 'International Mother Language Day'],
  ['2026-03-20', 'Eid ul-Fitr'],
  ['2026-03-21', 'Eid ul-Fitr Holiday'],
  ['2026-03-26', 'Independence Day'],
  ['2026-04-14', 'Pohela Boishakh (Bengali New Year)'],
  ['2026-05-01', 'May Day'],
  ['2026-05-27', 'Eid ul-Adha'],
  ['2026-05-28', 'Eid ul-Adha Holiday'],
  ['2026-12-16', 'Victory Day'],
  ['2026-12-25', 'Christmas Day'],
  ['2027-01-01', "New Year's Day"],
];

// First title in each list is used for the department manager.
const DESIGNATIONS = {
  'Engineering': ['Engineering Manager', 'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'DevOps Engineer', 'QA Tester', 'Database Admin'],
  'Human Resources': ['HR Manager', 'HR Director', 'HR Generalist', 'Recruiter', 'Payroll Specialist'],
  'Sales': ['Sales Manager', 'Account Executive', 'Sales Representative', 'Business Development'],
  'Marketing': ['Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Social Media Manager'],
  'Finance': ['Finance Manager', 'Accountant', 'Financial Analyst'],
  'Customer Support': ['Support Manager', 'Support Specialist', 'Customer Success Manager'],
  'Product & Design': ['Product Lead', 'Product Manager', 'UI/UX Designer'],
  'Operations': ['Operations Manager', 'Operations Analyst', 'Logistics Coordinator'],
};

const FIRST_NAMES = ['Aarav', 'Amelia', 'Ayesha', 'Benjamin', 'Chloe', 'Daniel', 'Elena', 'Farhan', 'Gabriel', 'Isabella', 'Jamal', 'Kavya', 'Lucas', 'Maya', 'Nadia', 'Noah', 'Oliver', 'Rafi', 'Rohan', 'Sadia', 'Samuel', 'Tahmid', 'Tanvir', 'Zara', 'Emma', 'Arif', 'Mia', 'Leo', 'Nusrat', 'Ethan', 'Sophia', 'Imran', 'Ava', 'Mehedi', 'Lily', 'Karim', 'Hana', 'Jack', 'Riya', 'Owen'];
const LAST_NAMES = ['Ahmed', 'Rahman', 'Hossain', 'Islam', 'Chowdhury', 'Khan', 'Miller', 'Johnson', 'Garcia', 'Nguyen', 'Taylor', 'Anderson', 'Thomas', 'Martin', 'Clark', 'Lewis', 'Walker', 'Young', 'King', 'Scott', 'Green', 'Baker', 'Hall', 'Sarkar', 'Das', 'Roy', 'Alam', 'Uddin', 'Kabir', 'Haque'];

// ---------------------------------------------------------------------------
// Tenant blueprints
// ---------------------------------------------------------------------------
const TENANTS = [
  {
    id: 1, name: 'Default Company', subdomain: 'default', domain: 'company.com', tag: 'DEF',
    admin: { name: 'Charlie Admin', email: 'charlie@company.com', department: 'Human Resources', designation: 'HR Director' },
    departments: [
      {
        name: 'Engineering', manager: { name: 'Alice Manager', email: 'alice@company.com' }, generate: 7,
        employees: [
          { name: 'Bob Employee', email: 'bob@company.com', designation: 'Software Engineer' },
          { name: 'Ethan Brown', email: 'ethan@company.com', designation: 'Database Admin' },
          { name: 'Hannah Lee', email: 'hannah@company.com', designation: 'Frontend Developer' },
        ],
      },
      { name: 'Human Resources', manager: { name: 'Diana Smith', email: 'diana@company.com' }, generate: 3, employees: [] },
      {
        name: 'Sales', manager: { name: 'Fiona Davis', email: 'fiona@company.com' }, generate: 5,
        employees: [{ name: 'George Wilson', email: 'george@company.com', designation: 'Account Executive' }],
      },
      { name: 'Marketing', manager: { name: 'Marcus Reed', email: 'marcus@company.com' }, generate: 4, employees: [] },
      { name: 'Finance', manager: { name: 'Priya Sharma', email: 'priya@company.com' }, generate: 3, employees: [] },
      { name: 'Customer Support', manager: { name: 'Sofia Martinez', email: 'sofia@company.com' }, generate: 4, employees: [] },
      { name: 'Product & Design', manager: { name: 'Liam Chen', email: 'liam@company.com' }, generate: 3, employees: [] },
    ],
  },
  {
    name: 'Acme Corporation', subdomain: 'acme', domain: 'acme.com', tag: 'ACM',
    admin: { name: 'Olivia Carter', email: 'admin@acme.com', department: 'Human Resources', designation: 'HR Director' },
    departments: [
      { name: 'Engineering', manager: { name: 'Nathan Brooks', email: 'nathan@acme.com' }, generate: 5, employees: [{ name: 'Emily Stone', email: 'emily@acme.com', designation: 'Backend Developer' }] },
      { name: 'Sales', manager: { name: 'Grace Kim', email: 'grace@acme.com' }, generate: 4, employees: [] },
      { name: 'Human Resources', manager: { name: 'Daniel Ortiz', email: 'daniel@acme.com' }, generate: 2, employees: [] },
    ],
  },
  {
    name: 'Globex Industries', subdomain: 'globex', domain: 'globex.com', tag: 'GLX',
    admin: { name: 'Victor Hale', email: 'admin@globex.com', department: 'Operations', designation: 'Operations Analyst' },
    departments: [
      { name: 'Operations', manager: { name: 'Isabel Novak', email: 'isabel@globex.com' }, generate: 4, employees: [{ name: 'Henry Ford', email: 'henry@globex.com', designation: 'Logistics Coordinator' }] },
      { name: 'Finance', manager: { name: 'Ryan Patel', email: 'ryan@globex.com' }, generate: 3, employees: [] },
    ],
  },
];

const ALL_NAMED_EMAILS = [
  SUPER_ADMIN.email,
  ...TENANTS.flatMap((t) => [
    t.admin.email,
    ...t.departments.flatMap((d) => [d.manager.email, ...d.employees.map((e) => e.email)]),
  ]),
];

// ---------------------------------------------------------------------------
// Bulk insert helper
// ---------------------------------------------------------------------------
const bulkInsert = async (table, columns, rows) => {
  if (!rows.length) return;
  const chunk = 500;
  for (let i = 0; i < rows.length; i += chunk) {
    await db.query(`INSERT IGNORE INTO ${table} (${columns.join(', ')}) VALUES ?`, [rows.slice(i, i + chunk)]);
  }
};

// ---------------------------------------------------------------------------
// Cleanup (only with --fresh)
// ---------------------------------------------------------------------------
async function cleanup() {
  console.log('🧹 Removing previous demo data...');

  // Seeded secondary tenants are dropped entirely (company_id FKs cascade).
  const extraSubdomains = TENANTS.filter((t) => !t.id).map((t) => t.subdomain);
  await db.query('DELETE FROM users WHERE company_id IN (SELECT id FROM companies WHERE subdomain IN (?))', [extraSubdomains]);
  await db.query('DELETE FROM companies WHERE subdomain IN (?)', [extraSubdomains]);

  // Default company: remove activity of seeded users but keep the user rows
  // (so IDs referenced elsewhere stay stable — they are upserted again below).
  const defaultTenant = TENANTS.find((t) => t.id === 1);
  const [users] = await db.query(
    `SELECT id FROM users WHERE company_id = 1 AND (email LIKE ? OR email = ?)`,
    [`%@${defaultTenant.domain}`, SUPER_ADMIN.email]
  );
  const ids = users.map((u) => u.id);

  if (ids.length) {
    const deletions = [
      ['leave_requests', 'user_id IN (?)', [ids]],
      ['attendance', 'user_id IN (?)', [ids]],
      ['payslips', 'user_id IN (?)', [ids]],
      ['performance_goals', 'employee_id IN (?) OR manager_id IN (?)', [ids, ids]],
      ['appraisals', 'employee_id IN (?) OR reviewer_id IN (?)', [ids, ids]],
      ['expense_claims', 'employee_id IN (?)', [ids]],
      ['internal_messages', 'sender_id IN (?) OR receiver_id IN (?)', [ids, ids]],
      ['activity_logs', 'performed_by IN (?) OR target_user IN (?)', [ids, ids]],
      ['transfer_requests', 'employee_id IN (?) OR requested_by IN (?)', [ids, ids]],
      ['member_requests', 'manager_id IN (?)', [ids]],
      ['job_postings', 'created_by IN (?)', [ids]],
    ];
    for (const [table, where, params] of deletions) {
      await db.query(`DELETE FROM ${table} WHERE ${where}`, params);
    }
  }
  await db.query(`DELETE FROM assets WHERE company_id = 1 AND asset_tag LIKE 'DEF-%'`);

  // Leftover departments created by the automated test-suite.
  await db.query(`DELETE FROM departments WHERE company_id = 1 AND name LIKE 'Marketing Test%'`);
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------
async function ensureCompany(t) {
  if (t.id) {
    await db.query('INSERT IGNORE INTO companies (id, name, subdomain) VALUES (?, ?, ?)', [t.id, t.name, t.subdomain]);
    return t.id;
  }
  const [rows] = await db.query('SELECT id FROM companies WHERE subdomain = ?', [t.subdomain]);
  if (rows.length) return rows[0].id;
  const [res] = await db.query('INSERT INTO companies (name, subdomain) VALUES (?, ?)', [t.name, t.subdomain]);
  return res.insertId;
}

async function ensureDepartment(name, companyId) {
  await db.query('INSERT IGNORE INTO departments (name, company_id) VALUES (?, ?)', [name, companyId]);
  const [[row]] = await db.query('SELECT id FROM departments WHERE name = ? AND company_id = ?', [name, companyId]);
  return row.id;
}

async function ensureDesignation(title, departmentId, companyId) {
  const [rows] = await db.query('SELECT id FROM designations WHERE title = ? AND department_id = ? AND company_id = ?', [title, departmentId, companyId]);
  if (rows.length) return rows[0].id;
  const [res] = await db.query('INSERT INTO designations (title, department_id, company_id) VALUES (?, ?, ?)', [title, departmentId, companyId]);
  return res.insertId;
}

async function upsertUser(u, hash) {
  const values = [u.name, hash, u.role, u.department_id, u.designation_id, u.total_leave_balance, u.base_salary, u.company_id];
  const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
  let id;
  if (rows.length) {
    id = rows[0].id;
    await db.query(
      `UPDATE users SET name = ?, password = ?, role = ?, department_id = ?, designation_id = ?,
              total_leave_balance = ?, base_salary = ?, company_id = ?, is_first_login = FALSE
       WHERE id = ?`,
      [...values, id]
    );
  } else {
    const [res] = await db.query(
      `INSERT INTO users (name, password, role, department_id, designation_id, total_leave_balance, base_salary, company_id, email, is_first_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [...values, u.email]
    );
    id = res.insertId;
  }
  // LPAD truncates values longer than its width, so pad to at least 4 digits but never cut the ID.
  await db.query(
    `UPDATE users SET employee_id = CONCAT('EMP-', LPAD(id, GREATEST(4, CHAR_LENGTH(id)), '0')) WHERE id = ? AND employee_id IS NULL`,
    [id]
  );
  return { ...u, id };
}

const usedNames = new Set();
function generatePerson(domain) {
  for (let i = 0; i < 500; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const email = `${first}.${last}@${domain}`.toLowerCase();
    if (!usedNames.has(email)) {
      usedNames.add(email);
      return { name: `${first} ${last}`, email };
    }
  }
  throw new Error('Ran out of unique names');
}

async function seedTenant(t, hash) {
  const companyId = await ensureCompany(t);
  const ctx = { tenant: t, companyId, users: [], employees: [], managers: [], admin: null, departments: [], leaveTypes: {}, holidays: new Set() };

  // Leave types & holidays (scoped per company)
  for (const type of LEAVE_TYPES) {
    await db.query('INSERT IGNORE INTO leave_types (type_name, company_id) VALUES (?, ?)', [type, companyId]);
  }
  const [types] = await db.query('SELECT id, type_name FROM leave_types WHERE company_id = ?', [companyId]);
  types.forEach((r) => { ctx.leaveTypes[r.type_name] = r.id; });

  await bulkInsert('public_holidays', ['date', 'name', 'company_id'], HOLIDAYS.map(([d, n]) => [d, n, companyId]));
  HOLIDAYS.forEach(([d]) => ctx.holidays.add(d));

  // Departments, designations & people
  const deptByName = {};
  for (const d of t.departments) {
    const deptId = await ensureDepartment(d.name, companyId);
    const titles = DESIGNATIONS[d.name];
    const desigIds = {};
    for (const title of titles) desigIds[title] = await ensureDesignation(title, deptId, companyId);
    deptByName[d.name] = { id: deptId, desigIds, titles };

    const manager = await upsertUser({
      ...d.manager, role: 'manager', company_id: companyId, department_id: deptId,
      designation_id: desigIds[titles[0]], total_leave_balance: randInt(12, 20),
      base_salary: randInt(80, 110) * 100,
    }, hash);
    await db.query('UPDATE departments SET manager_id = ? WHERE id = ?', [manager.id, deptId]);

    const dept = { id: deptId, name: d.name, manager, members: [], titles };
    ctx.departments.push(dept);
    ctx.managers.push(manager);
    ctx.users.push({ ...manager, department: d.name });

    const people = [
      ...d.employees,
      ...Array.from({ length: d.generate }, () => ({ ...generatePerson(t.domain), designation: pick(titles.slice(1)) })),
    ];
    for (const p of people) {
      const emp = await upsertUser({
        name: p.name, email: p.email, role: 'employee', company_id: companyId, department_id: deptId,
        designation_id: desigIds[p.designation] || desigIds[titles[1]],
        total_leave_balance: randInt(6, 20), base_salary: randInt(30, 70) * 100,
      }, hash);
      emp.manager_id = manager.id;
      emp.department = d.name;
      dept.members.push(emp);
      ctx.employees.push(emp);
      ctx.users.push(emp);
    }
  }

  // Admin
  if (!deptByName[t.admin.department]) {
    const deptId = await ensureDepartment(t.admin.department, companyId);
    deptByName[t.admin.department] = { id: deptId, desigIds: {} };
  }
  const adminDept = deptByName[t.admin.department];
  const adminDesig = adminDept.desigIds[t.admin.designation]
    || await ensureDesignation(t.admin.designation, adminDept.id, companyId);
  ctx.admin = await upsertUser({
    ...t.admin, role: 'admin', company_id: companyId, department_id: adminDept.id,
    designation_id: adminDesig, total_leave_balance: 20, base_salary: 12000,
  }, hash);
  ctx.users.push({ ...ctx.admin, department: t.admin.department });

  return ctx;
}

// ---------------------------------------------------------------------------
// Module data generators
// ---------------------------------------------------------------------------
const LEAVE_REASONS = {
  'Sick Leave': ['Fever and cold, advised rest by doctor', 'Recovering from dental surgery', 'Severe migraine', 'Food poisoning', 'Medical check-up and blood tests'],
  'Casual Leave': ['Personal errands', 'Attending a family function', 'Moving to a new apartment', 'Bank and government office visit', "Child's school event"],
  'Annual Leave': ["Family vacation to Cox's Bazar", 'Trip to the Sylhet tea gardens', 'Visiting hometown', "Close friend's wedding", 'Year-end holiday with family'],
};

const LEAVE_SLOTS = [
  { from: -80, to: -62, status: () => 'approved' },
  { from: -58, to: -38, status: () => pick(['approved', 'approved', 'rejected']) },
  { from: -34, to: -14, status: () => pick(['approved', 'rejected', 'cancelled']) },
  { from: 4, to: 20, status: () => 'pending' },
  { from: 25, to: 55, status: () => pick(['pending', 'approved']) },
];

function workingRange(startOffset, days, holidays) {
  let start = addDays(TODAY, startOffset);
  while (isWeekend(start) || holidays.has(fmtDate(start))) start = addDays(start, 1);
  const dates = [fmtDate(start)];
  let end = start;
  while (dates.length < days) {
    end = addDays(end, 1);
    if (!isWeekend(end) && !holidays.has(fmtDate(end))) dates.push(fmtDate(end));
  }
  return { start: fmtDate(start), end: fmtDate(end), dates };
}

async function seedLeaves(ctx) {
  const leaveDays = new Set(); // `${userId}|${date}` for approved leave
  const logs = [];
  const requesters = [...ctx.employees, ...ctx.managers];

  for (const user of requesters) {
    const slots = LEAVE_SLOTS.filter((_, i) => (i === 3 ? chance(0.65) : chance(0.6)));
    for (const slot of slots) {
      const type = pick(LEAVE_TYPES);
      const range = workingRange(randInt(slot.from, slot.to), randInt(1, 3), ctx.holidays);
      const status = slot.status();
      const [res] = await db.query(
        'INSERT INTO leave_requests (user_id, type_id, start_date, end_date, reason, status, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, ctx.leaveTypes[type], range.start, range.end, pick(LEAVE_REASONS[type]), status, ctx.companyId]
      );
      if (status === 'approved') range.dates.forEach((d) => leaveDays.add(`${user.id}|${d}`));
      if (status === 'approved' || status === 'rejected') {
        const approver = user.role === 'employee' ? user.manager_id : ctx.admin.id;
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        const when = at(addDays(new Date(range.start), -randInt(2, 6)), randInt(9, 17), randInt(0, 59));
        logs.push([`${label} Leave Request`, approver, user.id, `Status updated to ${status} for request ID ${res.insertId}`, fmtDateTime(when > new Date() ? new Date() : when), ctx.companyId]);
      }
    }
  }
  await bulkInsert('activity_logs', ['action', 'performed_by', 'target_user', 'details', 'created_at', 'company_id'], logs);
  return leaveDays;
}

async function seedAttendance(ctx, leaveDays) {
  // Today is left empty on purpose so the Clock-In widget can be tested.
  const rows = [];
  for (let back = 30; back >= 1; back--) {
    const day = addDays(TODAY, -back);
    const date = fmtDate(day);
    if (isWeekend(day) || ctx.holidays.has(date)) continue;
    for (const u of ctx.users) {
      if (leaveDays.has(`${u.id}|${date}`)) continue;
      if (chance(0.05)) continue; // absent
      if (chance(0.06)) {
        rows.push([u.id, date, fmtDateTime(at(day, 9, randInt(0, 30))), fmtDateTime(at(day, 13, randInt(0, 45))), 'half-day', 'Left early (personal reasons)', ctx.companyId]);
      } else {
        const late = chance(0.15);
        const inTime = late ? at(day, 10, randInt(0, 40)) : at(day, randInt(8, 9), randInt(0, 59));
        const outTime = at(day, randInt(17, 18), randInt(0, 59));
        rows.push([u.id, date, fmtDateTime(inTime), fmtDateTime(outTime), 'present', late ? 'Late arrival' : null, ctx.companyId]);
      }
    }
  }
  await bulkInsert('attendance', ['user_id', 'date', 'clock_in', 'clock_out', 'status', 'notes', 'company_id'], rows);
  return rows.length;
}

async function seedPayslips(ctx) {
  // Last three completed months — the current month is left for "Generate Payroll" testing.
  const rows = [];
  for (let m = 3; m >= 1; m--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
    for (const u of ctx.users) {
      const base = Number(u.base_salary);
      const workingDays = 22;
      const worked = randInt(18, workingDays);
      const unpaid = Math.round((base / workingDays) * (workingDays - worked) * 100) / 100;
      const tax = Math.round(base * 0.05 * 100) / 100;
      const deductions = Math.round((unpaid + tax) * 100) / 100;
      rows.push([u.id, d.getMonth() + 1, d.getFullYear(), base, worked, base, deductions, Math.round((base - deductions) * 100) / 100, m === 1 ? 'generated' : 'paid', ctx.companyId]);
    }
  }
  await bulkInsert('payslips', ['user_id', 'month', 'year', 'base_salary', 'days_worked', 'gross_pay', 'deductions', 'net_pay', 'status', 'company_id'], rows);
  return rows.length;
}

const CHAT_SCRIPTS = [
  ['Hi! Do you have a minute to review my pull request?', 'Sure, send me the link.', 'Here it is — mostly refactoring the auth flow.', 'Looks good, left two small comments.', 'Thanks! Fixed them already.'],
  ['Can we move our 1:1 to Thursday?', 'Thursday 3 PM works for me.', 'Perfect, I updated the invite.'],
  ['I submitted a leave request for next week.', 'Got it, I will review it today.', 'Thank you!'],
  ['The client meeting went really well today.', 'Great news! Please share the notes with the team.', 'Sent them by email just now.'],
  ['Reminder: weekly reports are due on Friday.', 'Noted, I will have mine ready by Thursday.'],
  ['Is the staging server down for you as well?', 'Yes, DevOps is already on it.', 'Okay, I will keep working locally for now.', 'It is back up now 👍'],
];
const ADMIN_TICKETS = [
  'Hello HR, my payslip for last month shows the wrong number of working days.',
  'Could you please update my bank account details for salary transfer?',
  'I need an employment verification letter for a visa application.',
  'My laptop charger stopped working — how do I request a replacement?',
];

async function seedMessages(ctx) {
  const rows = [];
  const now = new Date();
  const addConversation = (a, b, script, daysAgo, leaveUnread) => {
    let t = at(addDays(TODAY, -daysAgo), randInt(9, 16), randInt(0, 59));
    script.forEach((msg, i) => {
      const sender = i % 2 === 0 ? a : b;
      const receiver = i % 2 === 0 ? b : a;
      t = new Date(t.getTime() + randInt(2, 45) * 60000);
      if (t > now) t = new Date(now.getTime() - (script.length - i) * 60000);
      const isLast = i === script.length - 1;
      rows.push([sender.id, receiver.id, null, msg, isLast && leaveUnread ? 0 : 1, fmtDateTime(t), ctx.companyId]);
    });
  };

  for (const dept of ctx.departments) {
    for (const emp of dept.members) {
      if (chance(0.6)) addConversation(emp, dept.manager, pick(CHAT_SCRIPTS), randInt(0, 6), chance(0.4));
    }
    // A couple of peer conversations
    const members = shuffle(dept.members);
    for (let i = 0; i + 1 < members.length && i < 4; i += 2) {
      addConversation(members[i], members[i + 1], pick(CHAT_SCRIPTS), randInt(0, 10), chance(0.3));
    }
    addConversation(dept.manager, ctx.admin, pick(CHAT_SCRIPTS), randInt(0, 5), chance(0.5));
  }

  // Messages addressed to the HR/Admin inbox (target_role = 'admin')
  for (const emp of shuffle(ctx.employees).slice(0, 3)) {
    const t = at(addDays(TODAY, -randInt(0, 3)), randInt(9, 17), randInt(0, 59));
    rows.push([emp.id, null, 'admin', pick(ADMIN_TICKETS), 0, fmtDateTime(t > now ? now : t), ctx.companyId]);
  }

  await bulkInsert('internal_messages', ['sender_id', 'receiver_id', 'target_role', 'message', 'is_read', 'created_at', 'company_id'], rows);
  return rows.length;
}

const LOCATIONS = ['Dhaka, Bangladesh', 'Remote', 'Hybrid — Dhaka', 'Chattogram, Bangladesh'];
const EMPLOYMENT_TYPES = ['full-time', 'full-time', 'full-time', 'part-time', 'contract', 'internship'];

async function seedRecruitment(ctx) {
  ensureSampleResume();
  let postings = 0, applications = 0, interviews = 0;

  for (const dept of ctx.departments) {
    const titles = shuffle(dept.titles.slice(1)).slice(0, randInt(1, 2));
    for (const title of titles) {
      const status = pick(['open', 'open', 'open', 'closed', 'draft']);
      const type = pick(EMPLOYMENT_TYPES);
      const jobTitle = type === 'internship' ? `${title} Intern` : chance(0.4) ? `Senior ${title}` : title;
      const [job] = await db.query(
        `INSERT INTO job_postings (title, department_id, employment_type, location, description, requirements, status, created_by, company_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jobTitle, dept.id, type, pick(LOCATIONS),
          `${ctx.tenant.name} is looking for a ${jobTitle} to join our ${dept.name} team. You will collaborate with cross-functional teams, own meaningful projects end-to-end and help us scale.`,
          `• ${randInt(1, 5)}+ years of relevant experience\n• Strong communication and teamwork skills\n• Ownership mindset and attention to detail\n• Experience in a fast-paced environment is a plus`,
          status, ctx.admin.id, ctx.companyId,
        ]
      );
      postings++;
      if (status === 'draft') continue;

      for (let i = 0; i < randInt(3, 7); i++) {
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        const appStatus = pick(['new', 'new', 'reviewing', 'reviewing', 'interviewing', 'offered', 'rejected']);
        const appliedAt = at(addDays(TODAY, -randInt(1, 30)), randInt(8, 22), randInt(0, 59));
        const [app] = await db.query(
          `INSERT INTO job_applications (job_id, first_name, last_name, email, phone, resume_path, cover_letter, status, applied_at, company_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            job.insertId, first, last, `${first}.${last}${randInt(1, 99)}@mail.com`.toLowerCase(),
            `+8801${randInt(3, 9)}${randInt(10000000, 99999999)}`, 'uploads/resumes/sample_resume.pdf',
            `Dear Hiring Team,\n\nI am excited to apply for the ${jobTitle} role at ${ctx.tenant.name}. I believe my experience makes me a strong fit.\n\nBest regards,\n${first} ${last}`,
            appStatus, fmtDateTime(appliedAt), ctx.companyId,
          ]
        );
        applications++;

        if (appStatus === 'interviewing' || appStatus === 'offered') {
          const upcoming = appStatus === 'interviewing';
          const when = at(addDays(TODAY, upcoming ? randInt(1, 10) : -randInt(2, 15)), randInt(10, 16), pick([0, 30]));
          await db.query(
            `INSERT INTO interviews (application_id, interviewer_id, scheduled_time, meeting_link, status, notes, company_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [app.insertId, dept.manager.id, fmtDateTime(when), 'https://meet.google.com/abc-defg-hij',
              upcoming ? 'scheduled' : 'completed',
              upcoming ? 'Technical + culture-fit round' : 'Strong candidate — recommended for offer.', ctx.companyId]
          );
          interviews++;
        }
      }
    }
  }
  return { postings, applications, interviews };
}

function ensureSampleResume() {
  const dir = path.resolve(__dirname, '../uploads/resumes');
  const file = path.join(dir, 'sample_resume.pdf');
  if (fs.existsSync(file)) return;
  fs.mkdirSync(dir, { recursive: true });
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 88>>stream
BT /F1 24 Tf 72 700 Td (Sample Resume) Tj /F1 12 Tf 0 -30 Td (Demo file generated by seed.js) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  fs.writeFileSync(file, pdf);
}

const GOALS = [
  ['Complete AWS Cloud Practitioner certification', 'Strengthen cloud fundamentals to support upcoming migrations.'],
  ['Reduce average ticket resolution time by 20%', 'Improve processes and documentation to resolve issues faster.'],
  ['Mentor a junior team member', 'Hold weekly sessions and help them ramp up on our stack.'],
  ['Deliver Q4 roadmap milestones on time', 'Own planning and execution for assigned roadmap items.'],
  ['Improve automated test coverage to 80%', 'Add unit and integration tests for critical paths.'],
  ['Close 15 new enterprise deals', 'Grow the enterprise pipeline through outreach and referrals.'],
  ['Publish 4 knowledge-base articles', 'Document recurring questions to reduce support load.'],
  ['Lead an internal tech talk', 'Share learnings with the wider team.'],
];
const APPRAISAL_COMMENTS = {
  5: 'Outstanding performance — consistently exceeds expectations and lifts the whole team.',
  4: 'Strong contributor who delivers high-quality work reliably.',
  3: 'Meets expectations. Should focus on taking more ownership of larger tasks.',
  2: 'Below expectations this period; a development plan has been agreed.',
};

async function seedPerformance(ctx) {
  const goals = [];
  const appraisals = [];
  const reviewSubjects = [
    ...ctx.employees.map((e) => ({ user: e, reviewer: e.manager_id })),
    ...ctx.managers.map((m) => ({ user: m, reviewer: ctx.admin.id })),
  ];

  for (const { user, reviewer } of reviewSubjects) {
    for (const [title, desc] of shuffle(GOALS).slice(0, randInt(2, 3))) {
      const status = pick(['pending', 'in_progress', 'in_progress', 'completed', 'cancelled']);
      const target = addDays(TODAY, status === 'completed' ? -randInt(5, 40) : randInt(14, 120));
      goals.push([user.id, reviewer, title, desc, fmtDate(target), status, ctx.companyId]);
    }
    for (const period of ['Q2 2026', 'Q3 2026'].slice(0, randInt(1, 2))) {
      const rating = pick([2, 3, 3, 4, 4, 4, 5, 5]);
      appraisals.push([user.id, reviewer, period, rating, APPRAISAL_COMMENTS[rating], ctx.companyId]);
    }
  }
  await bulkInsert('performance_goals', ['employee_id', 'manager_id', 'title', 'description', 'target_date', 'status', 'company_id'], goals);
  await bulkInsert('appraisals', ['employee_id', 'reviewer_id', 'review_period', 'rating', 'comments', 'company_id'], appraisals);
  return { goals: goals.length, appraisals: appraisals.length };
}

const ASSET_CATALOG = {
  laptop: { code: 'LAP', names: ['MacBook Pro 14" M3', 'Dell XPS 15', 'Lenovo ThinkPad X1 Carbon', 'HP EliteBook 840 G10'] },
  monitor: { code: 'MON', names: ['Dell UltraSharp 27"', 'LG 27UK850 4K', 'Samsung 24" FHD'] },
  phone: { code: 'PHN', names: ['iPhone 15', 'Samsung Galaxy S24', 'Google Pixel 8'] },
  software: { code: 'SW', names: ['JetBrains All Products Pack', 'Adobe Creative Cloud', 'Microsoft 365 Business', 'Figma Professional'] },
  other: { code: 'OTH', names: ['YubiKey 5C NFC', 'Office Access Card', 'Logitech MX Keys Combo'] },
};

async function seedAssets(ctx) {
  const rows = [];
  const counters = {};
  const add = (category, status, user, notes) => {
    const { code, names } = ASSET_CATALOG[category];
    counters[code] = (counters[code] || 0) + 1;
    const tag = `${ctx.tenant.tag}-${code}-${String(counters[code]).padStart(3, '0')}`;
    const assignedDate = user ? fmtDate(addDays(TODAY, -randInt(10, 400))) : null;
    rows.push([tag, pick(names), category, status, user ? user.id : null, assignedDate, notes, ctx.companyId]);
  };

  for (const u of ctx.users) {
    add('laptop', 'assigned', u, 'Primary work device');
    if (chance(0.5)) add('monitor', 'assigned', u, null);
    if (u.role !== 'employee' && chance(0.7)) add('phone', 'assigned', u, 'Company phone');
    if (chance(0.35)) add('software', 'assigned', u, 'Annual licence');
    if (chance(0.25)) add('other', 'assigned', u, null);
  }
  for (let i = 0; i < 4; i++) add(pick(['laptop', 'monitor', 'other']), 'available', null, 'In IT storage');
  add('laptop', 'maintenance', null, 'Battery replacement in progress');
  add('monitor', 'maintenance', null, 'Dead pixels — sent for warranty repair');
  add('laptop', 'retired', null, 'End of life (2019 model)');

  await bulkInsert('assets', ['asset_tag', 'name', 'category', 'status', 'assigned_to', 'assigned_date', 'notes', 'company_id'], rows);
  return rows.length;
}

const EXPENSES = {
  travel: { range: [15, 450], items: ['Uber rides for client visit', 'Flight to Chattogram for client meeting', 'Train ticket for conference', 'Hotel stay during business trip'] },
  meals: { range: [10, 120], items: ['Team lunch after sprint demo', 'Client dinner', 'Working lunch during offsite'] },
  supplies: { range: [5, 80], items: ['Notebooks and stationery', 'Printer ink cartridges', 'Whiteboard markers'] },
  equipment: { range: [25, 300], items: ['USB-C docking station', 'Noise-cancelling headphones', 'Ergonomic mouse'] },
  other: { range: [10, 150], items: ['Online course subscription', 'Conference ticket', 'Internet bill (WFH allowance)'] },
};

async function seedExpenses(ctx) {
  const rows = [];
  for (const u of [...ctx.employees, ...ctx.managers]) {
    for (let i = 0; i < randInt(1, 3); i++) {
      const category = pick(Object.keys(EXPENSES));
      const { range, items } = EXPENSES[category];
      const status = pick(['pending', 'pending', 'approved', 'approved', 'approved', 'rejected']);
      const approver = status === 'pending' ? null : (u.role === 'employee' ? u.manager_id : ctx.admin.id);
      const amount = (randInt(range[0] * 100, range[1] * 100) / 100).toFixed(2);
      rows.push([u.id, fmtDate(addDays(TODAY, -randInt(1, 60))), amount, category, pick(items), null, status, approver, ctx.companyId]);
    }
  }
  await bulkInsert('expense_claims', ['employee_id', 'date', 'amount', 'category', 'description', 'receipt_path', 'status', 'approved_by', 'company_id'], rows);
  return rows.length;
}

const HEADCOUNT_ROLES = ['Senior Engineer to support the new product line', 'Intern for the summer cohort', 'Additional specialist due to increased workload', 'Team lead for the new regional office'];

async function seedOrgRequests(ctx) {
  const transfers = [];
  const members = [];
  if (ctx.departments.length > 1) {
    for (const dept of ctx.departments.slice(0, 4)) {
      const emp = dept.members[0];
      const target = pick(ctx.departments.filter((d) => d.id !== dept.id));
      if (emp) transfers.push([emp.id, target.id, dept.manager.id, pick(['pending', 'pending', 'approved', 'rejected']), ctx.companyId]);
    }
  }
  for (const dept of ctx.departments) {
    for (let i = 0; i < randInt(0, 2); i++) {
      members.push([dept.manager.id, dept.id, pick(dept.titles.slice(1)), pick(HEADCOUNT_ROLES), pick(['pending', 'pending', 'approved', 'rejected']), ctx.companyId]);
    }
  }
  await bulkInsert('transfer_requests', ['employee_id', 'target_department_id', 'requested_by', 'status', 'company_id'], transfers);
  await bulkInsert('member_requests', ['manager_id', 'department_id', 'requested_role', 'description', 'status', 'company_id'], members);

  const logs = ctx.users.filter((u) => u.id !== ctx.admin.id).slice(0, 10).map((u) => [
    'Created User', ctx.admin.id, u.id, `Created ${u.role} account for ${u.name}`,
    fmtDateTime(at(addDays(TODAY, -randInt(60, 120)), randInt(9, 17), randInt(0, 59))), ctx.companyId,
  ]);
  await bulkInsert('activity_logs', ['action', 'performed_by', 'target_user', 'details', 'created_at', 'company_id'], logs);
  return { transfers: transfers.length, headcount: members.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🌱 HRMS demo data seeder\n');

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [SUPER_ADMIN.email]);
  if (existing.length && !FRESH) {
    console.log('ℹ️  Demo data is already present. Run `npm run seed:fresh` to wipe and re-seed.\n');
    return;
  }
  if (FRESH) await cleanup();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const summary = [];
  const credentials = [];

  for (const tenant of TENANTS) {
    console.log(`🏢 Seeding ${tenant.name} (${tenant.subdomain})...`);
    const ctx = await seedTenant(tenant, hash);
    const leaveDays = await seedLeaves(ctx);
    const attendance = await seedAttendance(ctx, leaveDays);
    const payslips = await seedPayslips(ctx);
    const messages = await seedMessages(ctx);
    const ats = await seedRecruitment(ctx);
    const perf = await seedPerformance(ctx);
    const assets = await seedAssets(ctx);
    const expenses = await seedExpenses(ctx);
    const org = await seedOrgRequests(ctx);
    const [[{ leaves }]] = await db.query('SELECT COUNT(*) AS leaves FROM leave_requests WHERE company_id = ?', [ctx.companyId]);

    summary.push({
      Company: tenant.name, Users: ctx.users.length, Departments: ctx.departments.length, Leaves: leaves,
      Attendance: attendance, Payslips: payslips, Messages: messages, Jobs: ats.postings,
      Candidates: ats.applications, Goals: perf.goals, Assets: assets, Expenses: expenses,
    });

    for (const u of ctx.users) {
      if (ALL_NAMED_EMAILS.includes(u.email)) {
        credentials.push({ Company: tenant.subdomain, Role: u.role, Name: u.name, Email: u.email, Department: u.department });
      }
    }
  }

  // Super Admin is created last — it doubles as the "already seeded" marker.
  await upsertUser({ ...SUPER_ADMIN, role: 'superadmin', company_id: 1, department_id: null, designation_id: null, total_leave_balance: 0, base_salary: 0 }, hash);
  credentials.unshift({ Company: '— (platform)', Role: 'superadmin', Name: SUPER_ADMIN.name, Email: SUPER_ADMIN.email, Department: '—' });

  console.log('\n📊 Seed summary');
  console.table(summary);
  console.log(`\n🔑 Named demo accounts (password for ALL accounts: ${DEMO_PASSWORD})`);
  console.table(credentials);
  console.log('ℹ️  Generated employees follow the pattern firstname.lastname@<company-domain> and use the same password.\n');
  console.log('✅ Seeding complete.\n');
}

try {
  await main();
} catch (error) {
  console.error('❌ Seeding failed:', error);
  process.exitCode = 1;
} finally {
  await db.end();
}
