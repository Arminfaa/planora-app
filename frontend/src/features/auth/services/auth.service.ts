import { api } from '@/lib/api';
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
  ): Promise<AuthData> {
    const { data } = await api.post<ApiSuccessResponse<AuthData>>(
      '/auth/register',
      { name, email, password },
    );
    return data.data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<ApiSuccessResponse<User>>('/auth/me');
    return data.data;
  },
};
