import { api } from '@/lib/api';
import { refreshSession } from '@/lib/authSession';
import type { ApiSuccessResponse, AuthData, User } from '@/shared/types/api';

export const authService = {
  async login(email: string, password: string): Promise<AuthData> {
    const { data } = await api.post<ApiSuccessResponse<AuthData>>(
      '/auth/login',
      { email, password },
    );
    return data.data;
  },

  async register(
    name: string,
    email: string,
    password: string,
    inviteToken?: string,
  ): Promise<AuthData> {
    const { data } = await api.post<ApiSuccessResponse<AuthData>>(
      '/auth/register',
      { name, email, password, inviteToken },
    );
    return data.data;
  },

  async refresh(): Promise<void> {
    await refreshSession();
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<ApiSuccessResponse<User>>('/auth/me');
    return data.data;
  },

  async updateProfile(name: string): Promise<User> {
    const { data } = await api.patch<ApiSuccessResponse<User>>('/auth/me', {
      name,
    });
    return data.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    await api.patch('/auth/me/password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async previewResetPassword(token: string): Promise<{ email: string }> {
    const { data } = await api.get<ApiSuccessResponse<{ email: string }>>(
      '/auth/reset-password/preview',
      { params: { token } },
    );
    return data.data;
  },

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ email: string }> {
    const { data } = await api.post<ApiSuccessResponse<{ email: string }>>(
      '/auth/reset-password',
      {
        token,
        newPassword,
        confirmPassword,
      },
    );
    return data.data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ApiSuccessResponse<User>>(
      '/auth/me/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async removeAvatar(): Promise<User> {
    const { data } =
      await api.delete<ApiSuccessResponse<User>>('/auth/me/avatar');
    return data.data;
  },
};
