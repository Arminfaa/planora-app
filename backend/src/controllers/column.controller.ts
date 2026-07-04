import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { columnRepository } from '../repositories/column.repository';
import { boardRepository } from '../repositories/board.repository';
import { columnService } from '../services/column.service';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { notifyBoardColumnEvent } from '../utils/board-events';
import { getParam } from '../utils/params';
import type {
  CreateColumnInput,
  ReorderColumnsInput,
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

    const projectId = await boardRepository.getProjectId(boardId);
    if (projectId) {
      const board = await boardRepository.findById(boardId);
      void projectGroupActivityService.logColumnCreated(
        req.user!.userId,
        projectId,
        {
          columnId: column.id,
          columnName: column.name,
          boardName: board?.name,
        },
      );
    }

    ApiResponse.success(res, column, 'Column created', 201);
  },
);

export const updateColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const columnId = getParam(req.params, 'id');
    const input = req.body as UpdateColumnInput;
    const existing = await columnRepository.findById(columnId);
    const column = await columnService.update(
      req.user!.userId,
      columnId,
      input,
    );

    await notifyBoardColumnEvent(req.user!.userId, 'column:updated', {
      columnId,
      payload: { column },
    });

    if (existing && input.name && input.name !== existing.name) {
      const boardId = existing.boardId;
      const projectId = await boardRepository.getProjectId(boardId);
      if (projectId) {
        void projectGroupActivityService.logColumnUpdated(
          req.user!.userId,
          projectId,
          {
            columnId: column.id,
            columnName: column.name,
            changes: [`renamed to "${column.name}"`],
          },
        );
      }
    }

    ApiResponse.success(res, column, 'Column updated');
  },
);

export const deleteColumn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const columnId = getParam(req.params, 'id');
    const existing = await columnRepository.findById(columnId);
    const boardId = await columnRepository.getBoardId(columnId);

    await columnService.delete(req.user!.userId, columnId);

    if (boardId) {
      await notifyBoardColumnEvent(req.user!.userId, 'column:deleted', {
        boardId,
        columnId,
        payload: { columnId },
      });

      const projectId = await boardRepository.getProjectId(boardId);
      if (projectId && existing) {
        void projectGroupActivityService.logColumnDeleted(
          req.user!.userId,
          projectId,
          { columnId, columnName: existing.name },
        );
      }
    }

    ApiResponse.success(res, null, 'Column deleted');
  },
);

export const reorderColumns = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'boardId');
    const { columnIds } = req.body as ReorderColumnsInput;
    const columns = await columnService.reorder(
      req.user!.userId,
      boardId,
      columnIds,
    );

    await notifyBoardColumnEvent(req.user!.userId, 'columns:reordered', {
      boardId,
      payload: { columns },
    });

    ApiResponse.success(res, columns, 'Columns reordered');
  },
);
