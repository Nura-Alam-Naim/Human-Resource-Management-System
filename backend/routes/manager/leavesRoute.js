import express from 'express';
import { getAllRequests, updateStatus } from '../../controllers/manager/leavesController.js';
import { verifyToken, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';
import { updateStatusRules, validate } from '../../middleware/validators.js';

const router = express.Router();

router.use(verifyToken, verifyManagerOrAdmin);

router.get('/all-requests', getAllRequests);
router.put('/update-status/:request_id', updateStatusRules, validate, updateStatus);

export default router;
