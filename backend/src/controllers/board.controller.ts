import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { boardRepository } from '../repositories/board.repository';
import { boardService } from '../services/board.service';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
  notifyBoardMetaEvent,
  notifyProjectBoardEvent,
} from '../utils/board-events';
import { getParam } from '../utils/params';
import { imageUploadMiddleware } from '../middlewares/image-upload.middleware';
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

export const getBoardBySlug = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const board = await boardService.getByProjectAndSlug(
      req.user!.userId,
      getParam(req.params, 'projectId'),
      getParam(req.params, 'boardSlug'),
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
      projectId: board.projectId,
      payload: { board: boardPayload },
    });

    void projectGroupActivityService.logBoardCreated(
      req.user!.userId,
      projectId,
      {
        boardId: board.id,
        boardName: board.name,
      },
    );

    ApiResponse.success(res, board, 'Board created', 201);
  },
);

export const updateBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'id');
    const input = req.body as UpdateBoardInput;
    const existing = await boardRepository.findById(boardId);
    const board = await boardService.update(req.user!.userId, boardId, input);

    notifyProjectBoardEvent(req.user!.userId, 'board:updated', {
      projectId: board.projectId,
      boardId: board.id,
      payload: { board },
    });
    notifyBoardMetaEvent(req.user!.userId, board.id, board);

    if (existing && input.name && input.name !== existing.name) {
      void projectGroupActivityService.logBoardUpdated(
        req.user!.userId,
        board.projectId,
        {
          boardId: board.id,
          boardName: board.name,
          changes: [`renamed to "${board.name}"`],
        },
      );
    }

    ApiResponse.success(res, board, 'Board updated');
  },
);

export const deleteBoard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'id');
    const existing = await boardRepository.findById(boardId);
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

      if (existing) {
        void projectGroupActivityService.logBoardDeleted(
          req.user!.userId,
          projectId,
          { boardId, boardName: existing.name },
        );
      }
    }

    ApiResponse.success(res, null, 'Board deleted');
  },
);

export const uploadBoardBackground = [
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    imageUploadMiddleware(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const board = await boardService.uploadBackground(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.file as Express.Multer.File,
    );

    notifyProjectBoardEvent(req.user!.userId, 'board:updated', {
      projectId: board.projectId,
      boardId: board.id,
      payload: { board },
    });
    notifyBoardMetaEvent(req.user!.userId, board.id, board);

    ApiResponse.success(res, board, 'Board background uploaded');
  }),
];

export const removeBoardBackground = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const board = await boardService.removeBackground(
      req.user!.userId,
      getParam(req.params, 'id'),
    );

    notifyProjectBoardEvent(req.user!.userId, 'board:updated', {
      projectId: board.projectId,
      boardId: board.id,
      payload: { board },
    });
    notifyBoardMetaEvent(req.user!.userId, board.id, board);

    ApiResponse.success(res, board, 'Board background removed');
  },
);
