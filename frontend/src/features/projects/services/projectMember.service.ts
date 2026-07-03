import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type {
  AddMemberResult,
  AddProjectMemberInput,
  CreateInviteResult,
  InvitePreview,
  ProjectInvite,
  ProjectMember,
  ProjectRole,
} from '../types';

export const projectMemberService = {
  async list(projectId: string): Promise<ProjectMember[]> {
    const { data } = await api.get<ApiSuccessResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`,
    );
    return data.data;
  },

  async add(
    projectId: string,
    input: AddProjectMemberInput,
  ): Promise<AddMemberResult | CreateInviteResult> {
    const { data } = await api.post<
      ApiSuccessResponse<AddMemberResult | CreateInviteResult>
    >(`/projects/${projectId}/members`, input);
    return data.data;
  },

  async updateRole(
    projectId: string,
    userId: string,
    role: Exclude<ProjectRole, 'OWNER'>,
  ): Promise<ProjectMember> {
    const { data } = await api.patch<ApiSuccessResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    );
    return data.data;
  },

  async remove(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  async listInvites(projectId: string): Promise<ProjectInvite[]> {
    const { data } = await api.get<ApiSuccessResponse<ProjectInvite[]>>(
      `/projects/${projectId}/invites`,
    );
    return data.data;
  },

  async revokeInvite(projectId: string, inviteId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/invites/${inviteId}`);
  },
};

export const inviteService = {
  async getPreview(token: string): Promise<InvitePreview> {
    const { data } = await api.get<ApiSuccessResponse<InvitePreview>>(
      `/invites/${token}`,
    );
    return data.data;
  },

  async accept(token: string): Promise<{
    projectId: string;
    projectSlug: string;
    alreadyMember?: boolean;
  }> {
    const { data } = await api.post<
      ApiSuccessResponse<{
        projectId: string;
        projectSlug: string;
        alreadyMember?: boolean;
      }>
    >(`/invites/${token}/accept`);
    return data.data;
  },
};
