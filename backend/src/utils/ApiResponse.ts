import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string,
    errors: string[] = [],
    statusCode = 500,
  ): Response<ApiErrorResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
