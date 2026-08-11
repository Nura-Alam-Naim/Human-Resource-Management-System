import express from 'express';
import { uploadDocument, getMyDocuments, upload } from '../../controllers/employee/documentsController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/my-documents', getMyDocuments);

export default router;
