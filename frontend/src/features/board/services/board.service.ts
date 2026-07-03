import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { Board, CreateBoardInput, UpdateBoardInput } from '../types';

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

  async getBySlug(projectSlug: string, boardSlug: string): Promise<Board> {
    const { data } = await api.get<ApiSuccessResponse<Board>>(
      `/projects/${projectSlug}/boards/${boardSlug}`,
      { params: { _t: Date.now() } },
    );
    return data.data;
  },

  async create(projectId: string, input: CreateBoardInput): Promise<Board> {
    const { data } = await api.post<ApiSuccessResponse<Board>>(
      `/projects/${projectId}/boards`,
      input,
    );
    return data.data;
  },

  async update(id: string, input: UpdateBoardInput): Promise<Board> {
    const { data } = await api.patch<ApiSuccessResponse<Board>>(
      `/boards/${id}`,
      input,
    );
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/boards/${id}`);
  },
};
