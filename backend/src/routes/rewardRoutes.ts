import { Router } from 'express';
import * as rewardController from '../controllers/rewardController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);
router.get('/', rewardController.history);

export default router;
