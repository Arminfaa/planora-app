import { ApiError } from '../utils/ApiError';
import { signAccessToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';
import { inviteService } from './invite.service';
import {
  removeStoredFile,
  serializeAttachmentUrl,
  storeUploadedFile,
} from './storage/storage.service';
import { isImageMimeType } from './storage/storage.config';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../validators/auth.validator';
import { env } from '../config';
import { parseDurationToMs } from '../utils/duration';
import { generateRefreshToken, hashRefreshToken } from '../utils/refresh-token';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../utils/password-reset-token';
import { passwordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { emailService, PASSWORD_RESET_TTL_MS } from './email.service';
import { logger } from '../utils/logger';

const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar ? serializeAttachmentUrl(user.avatar) : null,
  createdAt: user.createdAt,
});

type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export class AuthService {
  private async issueAuthSession(user: {
    id: string;
    email: string;
  }): Promise<AuthSession> {
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(
      Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    );

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }

    if (input.inviteToken) {
      const preview = await inviteService.getPublicPreview(input.inviteToken);
      if (!preview.valid) {
        throw new ApiError(400, 'Invite is invalid or expired');
      }
      if (preview.email !== input.email) {
        throw new ApiError(400, 'Email must match the invite');
      }
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    let inviteAcceptance: {
      projectId: string;
      projectSlug: string;
    } | null = null;

    if (input.inviteToken) {
      inviteAcceptance = await inviteService.acceptDuringRegistration(
        user.id,
        input.inviteToken,
      );
    }

    const session = await this.issueAuthSession(user);

    return {
      user: sanitizeUser(user),
      ...session,
      inviteAcceptance,
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const session = await this.issueAuthSession(user);

    return {
      user: sanitizeUser(user),
      ...session,
    };
  }

  async refresh(rawRefreshToken: string) {
    const stored = await refreshTokenRepository.findValidByHash(
      hashRefreshToken(rawRefreshToken),
    );

    if (!stored) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    await refreshTokenRepository.revoke(stored.id);
    return this.issueAuthSession(user);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      return;
    }

    await refreshTokenRepository.revokeByHash(
      hashRefreshToken(rawRefreshToken),
    );
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return sanitizeUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updated = await userRepository.update(userId, { name: input.name });
    return sanitizeUser(updated);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValid = await comparePassword(input.currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const hashedPassword = await hashPassword(input.newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    await refreshTokenRepository.revokeAllForUser(userId);
  }

  /**
   * Always returns a generic success payload so callers cannot probe
   * whether an email is registered.
   */
  async requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      return;
    }

    if (!emailService.isConfigured()) {
      logger.error('Password reset requested but RESEND_API_KEY is missing');
      throw new ApiError(503, 'Email service is not configured');
    }

    await passwordResetTokenRepository.invalidateActiveForUser(user.id);

    const rawToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: hashPasswordResetToken(rawToken),
      expiresAt,
    });

    const resetUrl = `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send password reset email', {
        userId: user.id,
        error: detail,
        from: env.RESEND_FROM_EMAIL,
      });

      // Surface actionable Resend config issues (pending domain, bad from, etc.)
      const lower = detail.toLowerCase();
      if (
        lower.includes('not verified') ||
        lower.includes('domain') ||
        lower.includes('invalid `from`') ||
        lower.includes('invalid from')
      ) {
        throw new ApiError(
          502,
          'Email domain is not verified yet. Verify the domain in Resend, then try again.',
        );
      }

      throw new ApiError(502, 'Failed to send password reset email');
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const stored = await passwordResetTokenRepository.findValidByHash(
      hashPasswordResetToken(input.token),
    );

    if (!stored) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(input.newPassword);
    await userRepository.update(user.id, { password: hashedPassword });
    await passwordResetTokenRepository.markUsed(stored.id);
    await passwordResetTokenRepository.invalidateActiveForUser(user.id);
    await refreshTokenRepository.revokeAllForUser(user.id);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!file) {
      throw new ApiError(400, 'Image file is required');
    }

    if (!isImageMimeType(file.mimetype)) {
      throw new ApiError(400, 'Only image files are allowed');
    }

    const stored = await storeUploadedFile(file);
    if (stored.type !== 'IMAGE') {
      throw new ApiError(400, 'Only image files are allowed');
    }

    const updated = await userRepository.update(userId, {
      avatar: stored.url,
    });

    return sanitizeUser(updated);
  }

  async removeAvatar(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.avatar?.startsWith('/uploads/')) {
      const storageKey = user.avatar.replace(/^\/uploads\//, '');
      await removeStoredFile(storageKey, 'local', 'IMAGE').catch(
        () => undefined,
      );
    }

    const updated = await userRepository.update(userId, { avatar: null });
    return sanitizeUser(updated);
  }
}

export const authService = new AuthService();
