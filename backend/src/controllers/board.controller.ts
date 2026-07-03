import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { boardRepository } from '../repositories/board.repository';
import { boardService } from '../services/board.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
  notifyBoardMetaEvent,
  notifyProjectBoardEvent,
} from '../utils/board-events';
import { getParam } from '../utils/params';
import type {
  CreateBoardInput,
  UpdateBoardInput,
} from '../validators/board.validator';

export const listBoards = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boards = await boardService.listByProject(
      req.user!.userId,
      getParam(req.params, 'projectId'),
    );
    ApiResponse.success(res, boards, 'Boards retrieved');
  },
);

export const getBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const board = await boardService.getById(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, board, 'Board retrieved');
  },
);

export const createBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'projectId');
    const board = await boardService.create(
      req.user!.userId,
      projectId,
      req.body as CreateBoardInput,
    );

    const boardPayload = {
      ...board,
      _count: { columns: 3 },
    };

    notifyProjectBoardEvent(req.user!.userId, 'board:created', {
      projectId,
      payload: { board: boardPayload },
    });

    ApiResponse.success(res, board, 'Board created', 201);
  },
);

export const updateBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const board = await boardService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as UpdateBoardInput,
    );

    notifyProjectBoardEvent(req.user!.userId, 'board:updated', {
      projectId: board.projectId,
      boardId: board.id,
      payload: { board },
    });
    notifyBoardMetaEvent(req.user!.userId, board.id, board);

    ApiResponse.success(res, board, 'Board updated');
  },
);

export const deleteBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'id');
    const projectId = await boardRepository.getProjectId(boardId);

    await boardService.delete(req.user!.userId, boardId);

    if (projectId) {
      notifyProjectBoardEvent(req.user!.userId, 'board:deleted', {
        projectId,
        boardId,
        payload: { boardId },
      });
      notifyBoardMetaEvent(
        req.user!.userId,
        boardId,
        { id: boardId },
        'board:deleted',
      );
    }

    ApiResponse.success(res, null, 'Board deleted');
  },
);
