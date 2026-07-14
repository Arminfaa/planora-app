import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { CreateLabelInput, ProjectLabel, TaskLabel } from '../types';

export type UpdateLabelInput = {
  name?: string;
  color?: string;
};

export const labelService = {
  async listByProject(projectId: string): Promise<ProjectLabel[]> {
    const { data } = await api.get<ApiSuccessResponse<ProjectLabel[]>>(
      `/projects/${projectId}/labels`,
    );
    return data.data;
  },

  async create(
    projectId: string,
    input: CreateLabelInput,
  ): Promise<ProjectLabel> {
    const { data } = await api.post<ApiSuccessResponse<ProjectLabel>>(
      `/projects/${projectId}/labels`,
      input,
    );
    return data.data;
  },

  async update(
    projectId: string,
    labelId: string,
    input: UpdateLabelInput,
  ): Promise<ProjectLabel> {
    const { data } = await api.patch<ApiSuccessResponse<ProjectLabel>>(
      `/projects/${projectId}/labels/${labelId}`,
      input,
    );
    return data.data;
  },

  async delete(projectId: string, labelId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/labels/${labelId}`);
  },

  async assign(taskId: string, labelId: string): Promise<TaskLabel> {
    const { data } = await api.post<ApiSuccessResponse<TaskLabel>>(
      `/tasks/${taskId}/labels`,
      { labelId },
    );
    return data.data;
  },

  async remove(taskId: string, labelId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/labels/${labelId}`);
  },
};
