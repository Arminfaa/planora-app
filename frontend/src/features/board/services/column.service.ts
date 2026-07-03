import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type {
  BoardColumn,
  CreateColumnInput,
  UpdateColumnInput,
} from '../types';

export const columnService = {
  async create(
    boardId: string,
    input: CreateColumnInput,
  ): Promise<BoardColumn> {
    const { data } = await api.post<ApiSuccessResponse<BoardColumn>>(
      `/boards/${boardId}/columns`,
      input,
    );
    return data.data;
  },

  async update(id: string, input: UpdateColumnInput): Promise<BoardColumn> {
    const { data } = await api.patch<ApiSuccessResponse<BoardColumn>>(
      `/columns/${id}`,
      input,
    );
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/columns/${id}`);
  },
};
