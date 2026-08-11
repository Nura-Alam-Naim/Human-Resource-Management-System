import express from 'express';
import { getTeamAnalytics, getTeamUsers, getTeamUserProfile, createMemberRequest, getMyMemberRequests, getTeamDesignations, updateTeamUserDesignation, createTeamDesignation } from '../../controllers/manager/teamController.js';
import { verifyToken, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken, verifyManagerOrAdmin);

router.get('/analytics', getTeamAnalytics);
router.get('/users', getTeamUsers);
router.get('/users/:user_id', getTeamUserProfile);
router.post('/request-member', createMemberRequest);
router.get('/my-requests', getMyMemberRequests);
router.get('/designations', getTeamDesignations);
router.post('/designations', createTeamDesignation);
router.put('/users/:user_id/designation', updateTeamUserDesignation);

export default router;
