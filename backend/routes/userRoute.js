import express from 'express';
import {
    profile,
    getMyRequests,
    applyForLeave,
    editLeaveRequest,
    cancelLeaveRequest,
} from '../controllers/userController.js';

import { verifyToken } from '../middleware/authMiddleware.js';
import { applyLeaveRules, editLeaveRules, cancelLeaveRules, validate } from '../middleware/validators.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my-requests', getMyRequests);
router.post('/apply', applyLeaveRules, validate, applyForLeave);
router.put('/edit/:request_id', editLeaveRules, validate, editLeaveRequest);
router.put('/cancel/:request_id', cancelLeaveRules, validate, cancelLeaveRequest);
router.get('/profile', profile);

export default router;
