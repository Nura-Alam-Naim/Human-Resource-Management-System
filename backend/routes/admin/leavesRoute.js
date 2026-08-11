import express from 'express';
import { getAllRequests, updateStatus } from '../../controllers/admin/leavesController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';
import { updateStatusRules, validate } from '../../middleware/validators.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/all-requests', getAllRequests);
router.put('/update-status/:request_id', updateStatusRules, validate, updateStatus);

export default router;
