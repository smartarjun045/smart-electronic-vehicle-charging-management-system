import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import vehicleRoutes from './vehicleRoutes';
import stationRoutes from './stationRoutes';
import bookingRoutes from './bookingRoutes';
import sessionRoutes from './sessionRoutes';
import paymentRoutes from './paymentRoutes';
import rewardRoutes from './rewardRoutes';
import recommendationRoutes from './recommendationRoutes';
import rangeRoutes from './rangeRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/stations', stationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/sessions', sessionRoutes);
router.use('/payments', paymentRoutes);
router.use('/rewards', rewardRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/range', rangeRoutes);
router.use('/admin', adminRoutes);

export default router;
