import { Router } from 'express';
import * as bookingController from '../controllers/bookingController';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createBookingSchema } from '../validators/bookingValidators';

const router = Router();
router.use(requireAuth);
router.post('/', validateBody(createBookingSchema), bookingController.create);
router.get('/', bookingController.list);
router.get('/:id', bookingController.getById);
router.patch('/:id/cancel', bookingController.cancel);
router.post('/check-in', bookingController.checkIn);

export default router;
