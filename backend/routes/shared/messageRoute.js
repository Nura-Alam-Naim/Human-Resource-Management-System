import express from 'express';
import { getMessages, sendMessage, markAsRead } from '../../controllers/shared/messageController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getMessages);
router.post('/', sendMessage);
router.put('/:id/read', markAsRead);

export default router;
