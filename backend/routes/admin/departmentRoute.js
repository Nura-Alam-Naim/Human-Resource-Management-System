import express from 'express';
import { getAllDepartments, createDepartment, updateDepartment } from '../../controllers/admin/departmentController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in users can view departments
router.get('/', verifyToken, getAllDepartments);

// Only admins/managers can modify departments
router.post('/', verifyToken, verifyAdmin, createDepartment);
router.put('/:id', verifyToken, verifyAdmin, updateDepartment);

export default router;
