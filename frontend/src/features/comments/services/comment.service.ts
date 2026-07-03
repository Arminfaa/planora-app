import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { CreateCommentInput, TaskComment } from '../types';

export const commentService = {
  async list(taskId: string): Promise<TaskComment[]> {
    const { data } = await api.get<ApiSuccessResponse<TaskComment[]>>(
      `/tasks/${taskId}/comments`,
    );
    return data.data;
  },

  async create(
    taskId: string,
    input: CreateCommentInput,
  ): Promise<TaskComment> {
    const { data } = await api.post<ApiSuccessResponse<TaskComment>>(
      `/tasks/${taskId}/comments`,
      input,
    );
    return data.data;
  },

  async update(
    taskId: string,
    commentId: string,
    input: CreateCommentInput,
  ): Promise<TaskComment> {
    const { data } = await api.patch<ApiSuccessResponse<TaskComment>>(
      `/tasks/${taskId}/comments/${commentId}`,
      input,
    );
    return data.data;
  },

  async remove(taskId: string, commentId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};
