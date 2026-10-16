import { Router } from 'express';
import * as stationController from '../controllers/stationController';

const router = Router();
router.get('/nearby', stationController.nearby);
router.get('/:id', stationController.getById);
router.get('/', stationController.list);

export default router;
