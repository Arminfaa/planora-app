import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types';
import { translateMessage, translateMessages } from '../i18n/translate';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message: translateMessage(message),
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
      message: translateMessage(message),
      errors: translateMessages(errors),
    });
  }
}
