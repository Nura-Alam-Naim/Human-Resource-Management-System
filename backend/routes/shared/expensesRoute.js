import express from 'express';
import multer from 'multer';
import { 
    getMyClaims, 
    submitClaim, 
    getManageableClaims, 
    updateClaimStatus 
} from '../../controllers/shared/expensesController.js';
import { verifyToken, verifyManagerOrAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Using existing uploads folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'expense-' + uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

router.use(verifyToken);

// --- EMPLOYEE ROUTES ---
router.get('/my-claims', getMyClaims);
router.post('/submit', upload.single('receipt'), submitClaim);

// --- MANAGER/ADMIN ROUTES ---
router.get('/manage', verifyManagerOrAdmin, getManageableClaims);
router.put('/:id/status', verifyManagerOrAdmin, updateClaimStatus);

export default router;
