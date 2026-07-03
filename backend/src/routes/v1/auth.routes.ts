import { Router } from 'express';
import { getMe, login, register } from '../../controllers/auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../../validators/auth.validator';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  register,
);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
