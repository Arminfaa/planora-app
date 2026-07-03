import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { searchService } from '../services/search.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { SearchQuery } from '../validators/search.validator';

export const search = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { q, page, limit, projectId, boardId } =
      req.query as unknown as SearchQuery;

    const result = await searchService.search(
      req.user!.userId,
      q,
      page,
      limit,
      {
        projectId,
        boardId,
      },
    );

    ApiResponse.success(res, result, 'Search results retrieved');
  },
);
