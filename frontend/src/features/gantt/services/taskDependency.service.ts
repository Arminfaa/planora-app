import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { GanttDependency, TaskDependencyLists } from '../types';

export const taskDependencyService = {
  async listByTask(taskId: string): Promise<TaskDependencyLists> {
    const { data } = await api.get<ApiSuccessResponse<TaskDependencyLists>>(
      `/tasks/${taskId}/dependencies`,
    );
    return data.data;
  },

  async create(
    projectIdOrSlug: string,
    input: { fromTaskId: string; toTaskId: string },
  ): Promise<GanttDependency> {
    const { data } = await api.post<ApiSuccessResponse<GanttDependency>>(
      `/projects/${projectIdOrSlug}/dependencies`,
      input,
    );
    return data.data;
  },

  async delete(projectIdOrSlug: string, dependencyId: string): Promise<void> {
    await api.delete(
      `/projects/${projectIdOrSlug}/dependencies/${dependencyId}`,
    );
  },
};
