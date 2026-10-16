import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController';

const router = Router();
router.get('/', recommendationController.recommend);

export default router;
