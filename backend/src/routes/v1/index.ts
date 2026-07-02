import { Router } from 'express';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    ApiResponse.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'v1',
    });
  }),
);

export default router;
