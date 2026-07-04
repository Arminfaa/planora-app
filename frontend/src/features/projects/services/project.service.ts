import { api } from '@/lib/api';
import type { ApiSuccessResponse, PaginatedData } from '@/shared/types/api';
import type { PermissionGroup } from '@/features/permissions/registry';
import type {
  CreateProjectInput,
  Project,
  ProjectMember,
  ProjectProgressStats,
  ProjectRoleDefinition,
  UpdateProjectInput,
} from '../types';

export const projectService = {
  async list(page = 1, limit = 10): Promise<PaginatedData<Project>> {
    const { data } = await api.get<ApiSuccessResponse<PaginatedData<Project>>>(
      '/projects',
      { params: { page, limit } },
    );
    return data.data;
  },

  async getPermissionCatalog(): Promise<PermissionGroup[]> {
    const { data } = await api.get<ApiSuccessResponse<PermissionGroup[]>>(
      '/projects/permissions',
    );
    return data.data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await api.get<ApiSuccessResponse<Project>>(
      `/projects/${id}`,
    );
    return data.data;
  },

  async getBySlug(slug: string): Promise<Project> {
    const { data } = await api.get<ApiSuccessResponse<Project>>(
      `/projects/${slug}`,
    );
    return data.data;
  },

  async getProgressStats(projectId: string): Promise<ProjectProgressStats> {
    const { data } = await api.get<ApiSuccessResponse<ProjectProgressStats>>(
      `/projects/${projectId}/progress`,
    );
    return data.data;
  },

  async listMembers(projectId: string): Promise<ProjectMember[]> {
    const { data } = await api.get<ApiSuccessResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`,
    );
    return data.data;
  },

  async listRoles(projectId: string): Promise<ProjectRoleDefinition[]> {
    const { data } = await api.get<ApiSuccessResponse<ProjectRoleDefinition[]>>(
      `/projects/${projectId}/roles`,
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

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const { data } = await api.patch<ApiSuccessResponse<Project>>(
      `/projects/${id}`,
      input,
    );
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
