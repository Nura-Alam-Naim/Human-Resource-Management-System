import express from 'express';
import {
    profile,
    getMyRequests,
    applyForLeave,
    editLeaveRequest,
    cancelLeaveRequest,
} from '../controllers/userController.js';

import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply verifyToken to all user routes
router.use(verifyToken);

router.get('/my-requests', getMyRequests);
router.post('/apply', applyForLeave);
router.put('/edit/:request_id', editLeaveRequest);
router.put('/cancel/:request_id', cancelLeaveRequest);
router.get('/profile', profile);

export default router;
