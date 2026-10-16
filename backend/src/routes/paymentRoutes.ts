import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);
router.get('/mine', paymentController.listMine);
router.get('/booking/:bookingId', paymentController.getByBookingId);

export default router;
