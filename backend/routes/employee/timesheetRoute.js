import express from 'express';
import { clockIn, clockOut, resumeShift, getStatus, getMyRecords, getAllRecords } from '../../controllers/employee/timesheetController.js';
import { verifyToken, verifyAdmin, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Employee routes
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/resume-shift', resumeShift);
router.get('/status', getStatus);
router.get('/my-records', getMyRecords);

// Admin/Manager routes
router.get('/all', verifyAdmin, getAllRecords);

export default router;
