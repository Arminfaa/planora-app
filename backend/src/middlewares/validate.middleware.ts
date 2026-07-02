import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

const parseSchema = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  next: NextFunction,
): T | null => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`,
    );
    next(new ApiError(400, 'Validation failed', errors));
    return null;
  }

  return result.data;
};

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const data = parseSchema(schema, req.body, next);
    if (data) {
      req.body = data;
      next();
    }
  };

export const validateParams =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const data = parseSchema(schema, req.params, next);
    if (data) {
      req.params = data as Request['params'];
      next();
    }
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const data = parseSchema(schema, req.query, next);
    if (data) {
      req.query = data as Request['query'];
      next();
    }
  };
