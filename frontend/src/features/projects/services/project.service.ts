import { api } from '@/lib/api';
import type { ApiSuccessResponse, PaginatedData } from '@/shared/types/api';
import type { PermissionGroup } from '@/features/permissions/registry';
import type {
  CreateProjectInput,
  MemberLeave,
  PersonCompletionsStats,
  Project,
  ProjectHoliday,
  ProjectMember,
  ProjectProgressStats,
  ProjectRoleDefinition,
  UpdateProjectInput,
  WorkingCalendar,
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

  async getWorkingCalendar(projectId: string): Promise<WorkingCalendar> {
    const { data } = await api.get<ApiSuccessResponse<WorkingCalendar>>(
      `/projects/${projectId}/working-calendar`,
    );
    return data.data;
  },

  async updateWorkingWeekdays(
    projectId: string,
    nonWorkingWeekdays: number[],
  ): Promise<{ nonWorkingWeekdays: number[] }> {
    const { data } = await api.patch<
      ApiSuccessResponse<{ nonWorkingWeekdays: number[] }>
    >(`/projects/${projectId}/working-calendar/weekdays`, {
      nonWorkingWeekdays,
    });
    return data.data;
  },

  async createHoliday(
    projectId: string,
    input: { date: string; title?: string },
  ): Promise<ProjectHoliday> {
    const { data } = await api.post<ApiSuccessResponse<ProjectHoliday>>(
      `/projects/${projectId}/holidays`,
      input,
    );
    return data.data;
  },

  async deleteHoliday(projectId: string, holidayId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/holidays/${holidayId}`);
  },

  async createLeave(
    projectId: string,
    input: {
      userId: string;
      startDate: string;
      endDate: string;
      note?: string;
    },
  ): Promise<MemberLeave> {
    const { data } = await api.post<ApiSuccessResponse<MemberLeave>>(
      `/projects/${projectId}/leaves`,
      input,
    );
    return data.data;
  },

  async deleteLeave(projectId: string, leaveId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/leaves/${leaveId}`);
  },

  async getPersonCompletions(
    projectId: string,
    params: { userId: string; from: string; to: string },
  ): Promise<PersonCompletionsStats> {
    const { data } = await api.get<ApiSuccessResponse<PersonCompletionsStats>>(
      `/projects/${projectId}/analytics/completions`,
      { params },
    );
    return data.data;
  },

  async downloadBackup(projectId: string, projectSlug: string): Promise<void> {
    try {
      const response = await api.get<Blob>(`/projects/${projectId}/backup`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${projectSlug}-backup.planora`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const data = (error as { response?: { data?: unknown } }).response?.data;
      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        const text = await data.text();
        try {
          const parsed = JSON.parse(text) as { message?: string };
          throw Object.assign(
            new Error(parsed.message || 'Failed to download backup'),
            {
              response: { data: parsed },
            },
          );
        } catch (inner) {
          if (inner instanceof SyntaxError) {
            throw new Error(text || 'Failed to download backup');
          }
          throw inner;
        }
      }
      throw error;
    }
  },

  async importBackup(file: File): Promise<ProjectBackupImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<
      ApiSuccessResponse<ProjectBackupImportResult>
    >('/projects/backup/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300_000,
    });
    return data.data;
  },
};

export interface ProjectBackupImportResult {
  projectId: string;
  projectSlug: string;
  projectName: string;
  usersCreated: number;
  usersReused: number;
  boards: number;
  tasks: number;
  members: number;
  filesRestored: number;
  filesSkipped: number;
}
