import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController';
import { requireAuth } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createVehicleSchema } from '../validators/vehicleValidators';

const router = Router();
router.use(requireAuth);
router.post('/', validateBody(createVehicleSchema), vehicleController.create);
router.get('/', vehicleController.list);
router.delete('/:id', vehicleController.remove);

export default router;
