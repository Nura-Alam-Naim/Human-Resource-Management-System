import express from 'express';
import { getAllCompanies, registerCompany } from '../controllers/superadmin/companiesController.js';
import { verifyToken, verifySuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-company', registerCompany);
router.get('/companies', verifyToken, verifySuperAdmin, getAllCompanies);

export default router;
