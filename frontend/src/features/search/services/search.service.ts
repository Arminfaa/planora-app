import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type {
  SearchAssigneeOption,
  SearchParams,
  SearchResponse,
} from '../types';

export const searchService = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const { priority, ...rest } = params;
    const { data } = await api.get<ApiSuccessResponse<SearchResponse>>(
      '/search',
      {
        params: {
          ...rest,
          ...(priority?.length ? { priority: priority.join(',') } : {}),
        },
      },
    );
    return data.data;
  },

  async listAssignees(): Promise<SearchAssigneeOption[]> {
    const { data } =
      await api.get<ApiSuccessResponse<SearchAssigneeOption[]>>(
        '/search/assignees',
      );
    return data.data;
  },
};
