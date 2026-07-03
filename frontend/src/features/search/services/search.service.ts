import { api } from '@/lib/api';
import type { ApiSuccessResponse } from '@/shared/types/api';
import type { SearchParams, SearchResponse } from '../types';

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
};
