import express from 'express';
import { getConversations, getContacts, getChatHistory, sendMessage, markAsRead, getUnreadCount } from '../../controllers/shared/messageController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/conversations', getConversations);
router.get('/contacts', getContacts);
router.get('/unread-count', getUnreadCount);
router.get('/:otherId', getChatHistory);
router.post('/', sendMessage);
router.put('/:otherId/read', markAsRead);

export default router;
