import { Router } from 'express';
import * as rangeController from '../controllers/rangeController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.post('/estimate', requireAuth, rangeController.estimate);

export default router;
