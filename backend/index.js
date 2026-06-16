import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import db from './db.js';
import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';
import authRoute from './routes/authRoute.js';
import { startCronJobs } from './cron/jobs.js';


dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
startCronJobs();

app.use('/api/auth', authRoute);
app.use('/api/user/leaves', userRoute);
app.use('/api/admin/leaves', adminRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);

});
