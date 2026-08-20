import express from 'express';
import { getMemberRequests, updateMemberRequestStatus, getMemberRequestById } from '../../controllers/admin/requestsController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/', getMemberRequests);
router.get('/:id', getMemberRequestById);
router.put('/:id', updateMemberRequestStatus);

export default router;
