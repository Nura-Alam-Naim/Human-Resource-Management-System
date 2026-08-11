import express from 'express';
import { getAnalytics, getActivityLogs } from '../../controllers/admin/analyticsController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/', getAnalytics);
router.get('/logs', getActivityLogs);

export default router;
