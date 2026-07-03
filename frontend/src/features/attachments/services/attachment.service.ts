import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { TaskAttachment } from '../types';

export const attachmentService = {
  async list(taskId: string): Promise<TaskAttachment[]> {
    const { data } = await api.get<ApiSuccessResponse<TaskAttachment[]>>(
      `/tasks/${taskId}/attachments`,
    );
    return data.data;
  },

  async upload(taskId: string, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ApiSuccessResponse<TaskAttachment>>(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data.data;
  },

  async remove(taskId: string, attachmentId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },
};
