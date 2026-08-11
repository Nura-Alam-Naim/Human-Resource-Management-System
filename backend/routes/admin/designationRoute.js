import express from 'express';
import { getDesignationsByDepartment, getAllDesignations, createDesignation } from '../../controllers/admin/designationController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in users can view designations
router.get('/', verifyToken, getAllDesignations);
router.get('/department/:departmentId', verifyToken, getDesignationsByDepartment);

// Only admins/managers can create designations
router.post('/', verifyToken, verifyAdmin, createDesignation);

export default router;
