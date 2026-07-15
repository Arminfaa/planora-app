import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getMe,
  getSocketToken,
  login,
  logout,
  refresh,
  register,
  removeAvatar,
  resetPassword,
  resetPasswordPreview,
  updateProfile,
  uploadAvatar,
} from '../../controllers/auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { uploadMiddleware } from '../../middlewares/upload.middleware';
import {
  validateBody,
  validateQuery,
} from '../../middlewares/validate.middleware';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordPreviewSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../../validators/auth.validator';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  register,
);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', authRateLimiter, refresh);
router.post('/logout', logout);
router.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.get(
  '/reset-password/preview',
  authRateLimiter,
  validateQuery(resetPasswordPreviewSchema),
  resetPasswordPreview,
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.get('/me', authenticate, getMe);
router.get('/socket-token', authenticate, getSocketToken);
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  updateProfile,
);
router.patch(
  '/me/password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword,
);
router.post('/me/avatar', authenticate, uploadMiddleware, uploadAvatar);
router.delete('/me/avatar', authenticate, removeAvatar);

export default router;
