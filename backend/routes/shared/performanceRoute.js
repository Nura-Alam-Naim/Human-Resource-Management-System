import express from 'express';
import { 
    createGoal, 
    updateGoal, 
    createAppraisal, 
    getEmployeePerformance, 
    getMyPerformance, 
    updateMyGoalStatus 
} from '../../controllers/shared/performanceController.js';
import { verifyToken, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// --- EMPLOYEE ROUTES ---
router.get('/my-performance', getMyPerformance);
router.put('/my-goals/:id/status', updateMyGoalStatus);

// --- MANAGER/ADMIN ROUTES ---
router.post('/goals', verifyManagerOrAdmin, createGoal);
router.put('/goals/:id', verifyManagerOrAdmin, updateGoal);
router.post('/appraisals', verifyManagerOrAdmin, createAppraisal);
router.get('/team/:employee_id', verifyManagerOrAdmin, getEmployeePerformance);

export default router;
