import express from 'express';
import { getJobs, createJob, updateJob, deleteJob, getApplications, updateApplicationStatus } from '../../controllers/admin/atsController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/jobs', verifyToken, getJobs);
router.post('/jobs', verifyToken, createJob);
router.put('/jobs/:id', verifyToken, updateJob);
router.delete('/jobs/:id', verifyToken, deleteJob);

router.get('/applications', verifyToken, getApplications);
router.put('/applications/:id/status', verifyToken, updateApplicationStatus);

export default router;
