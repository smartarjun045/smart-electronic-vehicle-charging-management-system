import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateBody } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/authValidators';

const router = Router();
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

router.get('/google', authController.googleStart);
router.get('/google/callback', authController.googleCallback);
router.get('/github', authController.githubStart);
router.get('/github/callback', authController.githubCallback);

export default router;
