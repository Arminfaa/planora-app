import type { Response } from 'express';
import { ApiError } from '../utils/ApiError';
import type { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { clearAuthCookies, setAuthCookies } from '../utils/cookies';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth';
import { extractAccessToken } from '../utils/extractAccessToken';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../validators/auth.validator';

export const register = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    ApiResponse.success(
      res,
      {
        user: result.user,
        inviteAcceptance: result.inviteAcceptance,
      },
      'Registration successful',
      201,
    );
  },
);

export const login = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    ApiResponse.success(res, { user: result.user }, 'Login successful');
  },
);

export const refresh = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;

    if (!rawRefreshToken) {
      clearAuthCookies(res);
      throw new ApiError(401, 'Refresh token required');
    }

    const session = await authService.refresh(rawRefreshToken);
    setAuthCookies(res, session.accessToken, session.refreshToken);
    ApiResponse.success(res, null, 'Token refreshed');
  },
);

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      string | undefined;

    await authService.logout(rawRefreshToken);
    clearAuthCookies(res);
    ApiResponse.success(res, null, 'Logged out');
  },
);

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await authService.getProfile(req.user!.userId);
    ApiResponse.success(res, profile, 'Profile retrieved');
  },
);

export const getSocketToken = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const token = extractAccessToken(req);

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    ApiResponse.success(res, { token }, 'Socket token retrieved');
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

export const forgotPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.requestPasswordReset(req.body as ForgotPasswordInput);
    ApiResponse.success(
      res,
      null,
      'If an account exists for that email, a reset link has been sent',
    );
  },
);

export const resetPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await authService.resetPassword(req.body as ResetPasswordInput);
    ApiResponse.success(res, null, 'Password has been reset');
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
