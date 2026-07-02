import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { columnService } from '../services/column.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  CreateColumnInput,
  UpdateColumnInput,
} from '../validators/column.validator';

export const createColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const column = await columnService.create(
      req.user!.userId,
      getParam(req.params, 'boardId'),
      req.body as CreateColumnInput,
    );
    ApiResponse.success(res, column, 'Column created', 201);
  },
);

export const updateColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const column = await columnService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as UpdateColumnInput,
    );
    ApiResponse.success(res, column, 'Column updated');
  },
);

export const deleteColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await columnService.delete(req.user!.userId, getParam(req.params, 'id'));
    ApiResponse.success(res, null, 'Column deleted');
  },
);
