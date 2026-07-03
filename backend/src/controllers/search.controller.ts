import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { searchService } from '../services/search.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { SearchQuery } from '../validators/search.validator';

export const search = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { q, page, limit, projectId, boardId, priority, assigneeId, due } =
      req.query as unknown as SearchQuery;

    const result = await searchService.search(
      req.user!.userId,
      q,
      page,
      limit,
      {
        projectId,
        boardId,
        filters: { priority, assigneeId, due },
      },
    );

    ApiResponse.success(res, result, 'Search results retrieved');
  },
);

export const listSearchAssignees = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const assignees = await searchService.getAssignees(req.user!.userId);
    ApiResponse.success(res, assignees, 'Search assignees retrieved');
  },
);
