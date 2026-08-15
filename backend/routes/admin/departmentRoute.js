import express from 'express';
import { getAllDepartments, createDepartment, updateDepartment, getDepartmentDetails, updateTransferStatus } from '../../controllers/admin/departmentController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in users can view departments
router.get('/', verifyToken, getAllDepartments);
router.get('/:id', verifyToken, getDepartmentDetails);

// Only admins/managers can modify departments
router.post('/', verifyToken, verifyAdmin, createDepartment);
router.put('/:id', verifyToken, verifyAdmin, updateDepartment);
router.put('/transfer-requests/:id/status', verifyToken, verifyAdmin, updateTransferStatus);

export default router;
