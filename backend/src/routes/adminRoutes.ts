import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/analytics/overview', adminController.overview);
router.get('/analytics/bookings-by-day', adminController.bookingsByDay);
router.get('/analytics/revenue-by-day', adminController.revenueByDay);
router.get('/analytics/station-utilization', adminController.stationUtilization);
router.get('/analytics/charger-status', adminController.chargerStatusBreakdown);

router.get('/users', adminController.listUsers);

router.get('/stations', adminController.listStations);
router.post('/stations', adminController.createStation);
router.patch('/stations/:id', adminController.updateStation);

router.get('/chargers', adminController.listChargers);
router.post('/chargers', adminController.createCharger);
router.patch('/chargers/:id/status', adminController.updateChargerStatus);

router.get('/bookings', adminController.listBookings);
router.get('/sessions', adminController.listSessions);

router.get('/maintenance', adminController.listMaintenanceRecords);
router.post('/maintenance', adminController.createMaintenanceRecord);

router.get('/ocpp-log', adminController.ocppLog);

export default router;
