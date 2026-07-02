import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { boardService } from '../services/board.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
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
    const board = await boardService.create(
      req.user!.userId,
      getParam(req.params, 'projectId'),
      req.body as CreateBoardInput,
    );
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
    ApiResponse.success(res, board, 'Board updated');
  },
);

export const deleteBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await boardService.delete(req.user!.userId, getParam(req.params, 'id'));
    ApiResponse.success(res, null, 'Board deleted');
  },
);
