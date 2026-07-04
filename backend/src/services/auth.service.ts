import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { userRepository } from '../repositories/user.repository';
import { inviteService } from './invite.service';
import {
  removeStoredFile,
  serializeAttachmentUrl,
  storeUploadedFile,
} from './storage/storage.service';
import { isImageMimeType } from './storage/storage.config';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../validators/auth.validator';

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

export class AuthService {
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

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: sanitizeUser(user),
      token,
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

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: sanitizeUser(user),
      token,
    };
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
