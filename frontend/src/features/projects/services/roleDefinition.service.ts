import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { CustomRoleInput, ProjectRoleDefinition } from '../types';

export const roleDefinitionService = {
  async create(
    projectId: string,
    input: CustomRoleInput,
  ): Promise<ProjectRoleDefinition> {
    const { data } = await api.post<ApiSuccessResponse<ProjectRoleDefinition>>(
      `/projects/${projectId}/roles`,
      { name: input.name, permissions: input.permissions },
    );
    return data.data;
  },

  async update(
    projectId: string,
    roleId: string,
    input: Partial<CustomRoleInput>,
  ): Promise<ProjectRoleDefinition> {
    const { data } = await api.patch<ApiSuccessResponse<ProjectRoleDefinition>>(
      `/projects/${projectId}/roles/${roleId}`,
      input,
    );
    return data.data;
  },

  async delete(projectId: string, roleId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/roles/${roleId}`);
  },
};
