import express from 'express';
import { uploadDocument, getMyDocuments, deleteDocument, uploadProfilePicture, upload } from '../../controllers/employee/documentsController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/my-documents', getMyDocuments);
router.delete('/:id', deleteDocument);
router.post('/profile-picture', upload.single('image'), uploadProfilePicture);

export default router;
