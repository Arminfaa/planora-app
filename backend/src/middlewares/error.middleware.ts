import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../utils/logger';

export const notFoundHandler = (_req: Request, res: Response): Response => {
  return ApiResponse.error(res, 'Route not found', [], 404);
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.errors, err.statusCode);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return ApiResponse.error(res, 'Validation failed', errors, 400);
  }

  logger.error(err.message, { stack: err.stack });

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return ApiResponse.error(res, message, [], 500);
};
