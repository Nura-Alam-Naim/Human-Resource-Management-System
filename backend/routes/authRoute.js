import express from 'express';
import { login, logout, changePassword, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.put('/change-password', verifyToken, changePassword);
router.get('/me', verifyToken, getMe);

export default router;
