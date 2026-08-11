import express from 'express';
import { getHolidays, createHoliday, deleteHoliday, syncHolidays } from '../../controllers/shared/holidayController.js';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', getHolidays);

// Only admins can modify holidays (in our case, 'manager' role acts as admin, or explicit verifyAdmin)
router.post('/', verifyAdmin, createHoliday);
router.post('/sync', verifyAdmin, syncHolidays);
router.delete('/:id', verifyAdmin, deleteHoliday);

export default router;
