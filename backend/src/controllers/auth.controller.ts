import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

export const register = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    ApiResponse.success(res, result, 'Registration successful', 201);
  },
);

export const login = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    ApiResponse.success(res, result, 'Login successful');
  },
);

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await authService.getProfile(req.user!.userId);
    ApiResponse.success(res, profile, 'Profile retrieved');
  },
);
