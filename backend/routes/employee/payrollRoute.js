import express from 'express';
import { getMyPayslips } from '../../controllers/employee/payrollController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my-payslips', getMyPayslips);

export default router;
