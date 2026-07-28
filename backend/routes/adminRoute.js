import express from 'express';
import { getAllRequests, updateStatus, getUserProfile, createUser, getAllUsers, getAnalytics, getActivityLogs } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { updateStatusRules, createUserRules, validate } from '../middleware/validators.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/all-requests', getAllRequests);
router.put('/update-status/:request_id', updateStatusRules, validate, updateStatus);
router.get('/users', getAllUsers);
router.get('/users/:user_id', getUserProfile);
router.get('/analytics', getAnalytics);
router.get('/logs', getActivityLogs);
router.post('/create-user', createUserRules, validate, createUser);

export default router;
