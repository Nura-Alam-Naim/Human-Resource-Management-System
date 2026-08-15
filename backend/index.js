import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import db from './db.js';
import authRoute from './routes/shared/authRoute.js';
import holidayRoute from './routes/shared/holidayRoute.js';
import messageRoute from './routes/shared/messageRoute.js';

import employeeLeavesRoute from './routes/employee/leavesRoute.js';
import employeeTimesheetRoute from './routes/employee/timesheetRoute.js';
import employeeDocumentsRoute from './routes/employee/documentsRoute.js';
import employeePayrollRoute from './routes/employee/payrollRoute.js';

import adminLeavesRoute from './routes/admin/leavesRoute.js';
import adminUsersRoute from './routes/admin/usersRoute.js';
import adminAnalyticsRoute from './routes/admin/analyticsRoute.js';
import adminRequestsRoute from './routes/admin/requestsRoute.js';
import adminDepartmentRoute from './routes/admin/departmentRoute.js';
import adminDesignationRoute from './routes/admin/designationRoute.js';
import adminPayrollRoute from './routes/admin/payrollRoute.js';

import managerLeavesRoute from './routes/manager/leavesRoute.js';
import managerTeamRoute from './routes/manager/teamRoute.js';
import { startCronJobs } from './cron/jobs.js';
import { validateEnv } from './utils/envValidator.js';


dotenv.config();

// Validate critical environment variables before starting the server
validateEnv();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Trust the proxy (Render/Heroku/etc load balancers) so secure cookies work!
app.set('trust proxy', 1);

const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
startCronJobs();

// Shared Routes
app.use('/api/auth', authRoute);
app.use('/api/holidays', holidayRoute);
app.use('/api/messages', messageRoute);

// Employee Routes
app.use('/api/user/leaves', employeeLeavesRoute);
app.use('/api/attendance', employeeTimesheetRoute);
app.use('/api/documents', employeeDocumentsRoute);
app.use('/api/payroll', employeePayrollRoute);

// Admin Routes
app.use('/api/admin/leaves', adminLeavesRoute); // Handles /api/admin/leaves/all-requests and /api/admin/leaves/update-status
app.use('/api/admin/leaves/users', adminUsersRoute);
app.use('/api/admin/leaves/analytics', adminAnalyticsRoute);
app.use('/api/requests/member', adminRequestsRoute);
app.use('/api/departments', adminDepartmentRoute);
app.use('/api/designations', adminDesignationRoute);
app.use('/api/admin/payroll', adminPayrollRoute);

// Manager Routes
app.use('/api/manager/leaves', managerLeavesRoute);
app.use('/api/manager/team', managerTeamRoute);

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
