import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { TaskChecklistItem } from '../types';

export const checklistService = {
  async list(taskId: string): Promise<TaskChecklistItem[]> {
    const { data } = await api.get<ApiSuccessResponse<TaskChecklistItem[]>>(
      `/tasks/${taskId}/checklist`,
    );
    return data.data;
  },

  async create(taskId: string, title: string): Promise<TaskChecklistItem> {
    const { data } = await api.post<ApiSuccessResponse<TaskChecklistItem>>(
      `/tasks/${taskId}/checklist`,
      { title },
    );
    return data.data;
  },

  async update(
    taskId: string,
    itemId: string,
    input: { title?: string; isDone?: boolean },
  ): Promise<TaskChecklistItem> {
    const { data } = await api.patch<ApiSuccessResponse<TaskChecklistItem>>(
      `/tasks/${taskId}/checklist/${itemId}`,
      input,
    );
    return data.data;
  },

  async delete(taskId: string, itemId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
  },
};
