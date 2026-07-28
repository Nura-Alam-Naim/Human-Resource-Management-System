import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import db from './db.js';
import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';
import authRoute from './routes/authRoute.js';
import { startCronJobs } from './cron/jobs.js';
import { validateEnv } from './utils/envValidator.js';


dotenv.config();

// Validate critical environment variables before starting the server
validateEnv();

const app = express();
app.use(express.json());
app.use(cookieParser());
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

app.use('/api/auth', authRoute);
app.use('/api/user/leaves', userRoute);
app.use('/api/admin/leaves', adminRoute);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
