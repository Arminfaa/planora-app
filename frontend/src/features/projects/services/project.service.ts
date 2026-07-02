import { api } from '@/lib/api';
import type { ApiSuccessResponse, PaginatedData } from '@/shared/types/api';
import type { CreateProjectInput, Project } from '../types';

export const projectService = {
  async list(page = 1, limit = 10): Promise<PaginatedData<Project>> {
    const { data } = await api.get<ApiSuccessResponse<PaginatedData<Project>>>(
      '/projects',
      { params: { page, limit } },
    );
    return data.data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await api.get<ApiSuccessResponse<Project>>(
      `/projects/${id}`,
    );
    return data.data;
  },

  async create(input: CreateProjectInput): Promise<Project> {
    const { data } = await api.post<ApiSuccessResponse<Project>>(
      '/projects',
      input,
    );
    return data.data;
  },
};
