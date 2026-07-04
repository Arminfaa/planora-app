import { api } from '@/lib/api';
import type { ApiSuccessResponse, PaginatedData } from '@/shared/types/api';
import type {
  CreateGroupMessageInput,
  ProjectGroupMessage,
  UpdateGroupMessageInput,
} from '../types';

export const projectGroupService = {
  async list(
    projectId: string,
    page = 1,
    limit = 30,
  ): Promise<PaginatedData<ProjectGroupMessage>> {
    const { data } = await api.get<
      ApiSuccessResponse<PaginatedData<ProjectGroupMessage>>
    >(`/projects/${projectId}/group/messages`, {
      params: { page, limit },
    });
    return data.data;
  },

  async send(
    projectId: string,
    input: CreateGroupMessageInput,
  ): Promise<ProjectGroupMessage> {
    const { data } = await api.post<ApiSuccessResponse<ProjectGroupMessage>>(
      `/projects/${projectId}/group/messages`,
      input,
    );
    return data.data;
  },

  async uploadFile(
    projectId: string,
    file: File,
    content?: string,
  ): Promise<ProjectGroupMessage> {
    const formData = new FormData();
    formData.append('file', file);
    if (content?.trim()) {
      formData.append('content', content.trim());
    }

    const { data } = await api.post<ApiSuccessResponse<ProjectGroupMessage>>(
      `/projects/${projectId}/group/messages/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  async update(
    projectId: string,
    messageId: string,
    input: UpdateGroupMessageInput,
  ): Promise<ProjectGroupMessage> {
    const { data } = await api.patch<ApiSuccessResponse<ProjectGroupMessage>>(
      `/projects/${projectId}/group/messages/${messageId}`,
      input,
    );
    return data.data;
  },

  async remove(projectId: string, messageId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/group/messages/${messageId}`);
  },
};
