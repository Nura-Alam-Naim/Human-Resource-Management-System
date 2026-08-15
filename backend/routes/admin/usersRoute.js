import express from 'express';
import { getUserProfile, createUser, getAllUsers, updateUserDesignation, updateUserRole, updateUserDepartment } from '../../controllers/admin/usersController.js';
import { verifyToken, verifyAdmin, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';
import { createUserRules, validate } from '../../middleware/validators.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', verifyManagerOrAdmin, getAllUsers);
router.get('/:user_id', verifyManagerOrAdmin, getUserProfile);
router.post('/create-user', verifyAdmin, createUserRules, validate, createUser);
router.put('/:user_id/designation', verifyAdmin, updateUserDesignation);
router.put('/:user_id/role', verifyAdmin, updateUserRole);
router.put('/:user_id/department', verifyAdmin, updateUserDepartment);

export default router;
