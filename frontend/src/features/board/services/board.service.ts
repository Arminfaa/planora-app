import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { Board } from '../types';

export const boardService = {
  async listByProject(projectId: string): Promise<Board[]> {
    const { data } = await api.get<ApiSuccessResponse<Board[]>>(
      `/projects/${projectId}/boards`,
    );
    return data.data;
  },

  async getById(id: string): Promise<Board> {
    const { data } = await api.get<ApiSuccessResponse<Board>>(`/boards/${id}`, {
      params: { _t: Date.now() },
    });
    return data.data;
  },
};
