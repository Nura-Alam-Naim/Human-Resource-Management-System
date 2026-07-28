import express from 'express';
import { login, logout, changePassword, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { loginRules, changePasswordRules, validate } from '../middleware/validators.js';

const router = express.Router();

router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.put('/change-password', verifyToken, changePasswordRules, validate, changePassword);
router.get('/me', verifyToken, getMe);

export default router;
