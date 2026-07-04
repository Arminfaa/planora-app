import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import { extractAccessToken } from '../utils/extractAccessToken';

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractAccessToken(req);

  if (!token) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
