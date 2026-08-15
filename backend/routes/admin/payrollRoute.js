import express from 'express';
import { getEmployeesSalary, generatePayslip, getAllPayslips } from '../../controllers/admin/payrollController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

router.get('/salaries', getEmployeesSalary);
router.post('/generate', generatePayslip);
router.get('/payslips', getAllPayslips);

export default router;
