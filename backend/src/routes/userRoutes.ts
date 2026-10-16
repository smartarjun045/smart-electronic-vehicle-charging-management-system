import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.get('/me', requireAuth, userController.getMe);

export default router;
