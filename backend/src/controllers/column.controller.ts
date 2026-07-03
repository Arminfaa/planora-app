import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { columnRepository } from '../repositories/column.repository';
import { columnService } from '../services/column.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { notifyBoardColumnEvent } from '../utils/board-events';
import { getParam } from '../utils/params';
import type {
  CreateColumnInput,
  UpdateColumnInput,
} from '../validators/column.validator';

export const createColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'boardId');
    const column = await columnService.create(
      req.user!.userId,
      boardId,
      req.body as CreateColumnInput,
    );

    await notifyBoardColumnEvent(req.user!.userId, 'column:created', {
      boardId,
      payload: { column },
    });

    ApiResponse.success(res, column, 'Column created', 201);
  },
);

export const updateColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const columnId = getParam(req.params, 'id');
    const column = await columnService.update(
      req.user!.userId,
      columnId,
      req.body as UpdateColumnInput,
    );

    await notifyBoardColumnEvent(req.user!.userId, 'column:updated', {
      columnId,
      payload: { column },
    });

    ApiResponse.success(res, column, 'Column updated');
  },
);

export const deleteColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const columnId = getParam(req.params, 'id');
    const boardId = await columnRepository.getBoardId(columnId);

    await columnService.delete(req.user!.userId, columnId);

    if (boardId) {
      await notifyBoardColumnEvent(req.user!.userId, 'column:deleted', {
        boardId,
        columnId,
        payload: { columnId },
      });
    }

    ApiResponse.success(res, null, 'Column deleted');
  },
);
