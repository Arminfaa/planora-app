import { Router } from 'express';
import { checkDatabaseHealth } from '../../config';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await checkDatabaseHealth();

    ApiResponse.success(res, {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: 'v1',
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  }),
);

export default router;
