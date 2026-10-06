import express from 'express';
import { getOpenJobs, applyForJob, uploadResume } from '../../controllers/public/careersController.js';

import { resolveTenant } from '../../middleware/tenantMiddleware.js';

const router = express.Router();

// Apply tenant resolution to all public career routes
router.use(resolveTenant);

router.get('/jobs', getOpenJobs);
router.post('/apply', uploadResume.single('resume'), applyForJob);

export default router;
