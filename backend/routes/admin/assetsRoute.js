import express from 'express';
import { 
    getAssets, 
    createAsset, 
    updateAsset, 
    deleteAsset,
    getMyAssets
} from '../../controllers/admin/assetsController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Employee Route
router.get('/my-assets', getMyAssets);

// Admin Routes
router.get('/', verifyAdmin, getAssets);
router.post('/', verifyAdmin, createAsset);
router.put('/:id', verifyAdmin, updateAsset);
router.delete('/:id', verifyAdmin, deleteAsset);

export default router;
