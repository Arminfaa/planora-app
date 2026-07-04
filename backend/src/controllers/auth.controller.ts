import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../validators/auth.validator';

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

export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await authService.updateProfile(
      req.user!.userId,
      req.body as UpdateProfileInput,
    );
    ApiResponse.success(res, profile, 'Profile updated');
  },
);

export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.changePassword(
      req.user!.userId,
      req.body as ChangePasswordInput,
    );
    ApiResponse.success(res, null, 'Password updated');
  },
);

export const uploadAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await authService.uploadAvatar(
      req.user!.userId,
      req.file as Express.Multer.File,
    );
    ApiResponse.success(res, profile, 'Avatar updated');
  },
);

export const removeAvatar = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await authService.removeAvatar(req.user!.userId);
    ApiResponse.success(res, profile, 'Avatar removed');
  },
);
