import express from 'express';
import { getAllRequests, updateStatus, getUserProfile, createUser } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/all-requests', getAllRequests);
router.put('/update-status/:request_id', updateStatus);
router.get('/users/:user_id', getUserProfile);
router.post('/create-user', createUser);

export default router;
