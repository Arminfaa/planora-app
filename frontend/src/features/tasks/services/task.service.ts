import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { BoardTask } from '@/features/board/types';
import type { CreateTaskInput, Task, UpdateTaskInput } from '../types';

export const taskService = {
  async getById(id: string): Promise<Task> {
    const { data } = await api.get<ApiSuccessResponse<Task>>(`/tasks/${id}`);
    return data.data;
  },

  async create(columnId: string, input: CreateTaskInput): Promise<BoardTask> {
    const { data } = await api.post<ApiSuccessResponse<BoardTask>>(
      `/columns/${columnId}/tasks`,
      input,
    );
    return data.data;
  },

  async update(id: string, input: UpdateTaskInput): Promise<BoardTask> {
    const { data } = await api.patch<ApiSuccessResponse<BoardTask>>(
      `/tasks/${id}`,
      input,
    );
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async listByBoard(boardId: string): Promise<BoardTask[]> {
    const { data } = await api.get<ApiSuccessResponse<BoardTask[]>>(
      `/boards/${boardId}/tasks`,
      { params: { _t: Date.now() } },
    );
    return data.data;
  },

  async createOnBoard(
    boardId: string,
    input: CreateTaskInput,
  ): Promise<BoardTask> {
    const { data } = await api.post<ApiSuccessResponse<BoardTask>>(
      `/boards/${boardId}/tasks`,
      input,
    );
    return data.data;
  },
};
