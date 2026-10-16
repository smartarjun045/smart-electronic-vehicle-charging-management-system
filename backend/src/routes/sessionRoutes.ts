import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);
router.post('/start', sessionController.start);
router.post('/:id/stop', sessionController.stop);
router.get('/:id', sessionController.getById);

export default router;
