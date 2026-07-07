import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { ProjectGanttData } from '../types';

export const ganttService = {
  async getByProject(projectIdOrSlug: string): Promise<ProjectGanttData> {
    const { data } = await api.get<ApiSuccessResponse<ProjectGanttData>>(
      `/projects/${projectIdOrSlug}/gantt`,
    );
    return data.data;
  },
};
