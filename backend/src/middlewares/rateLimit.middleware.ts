import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config';

const rateLimitMessage = {
  success: false,
  message: 'Too many requests, please try again later.',
  errors: [],
};

const noopRateLimiter: RequestHandler = (_req, _res, next) => next();

export const authRateLimiter: RequestHandler =
  env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: rateLimitMessage,
      })
    : noopRateLimiter;
