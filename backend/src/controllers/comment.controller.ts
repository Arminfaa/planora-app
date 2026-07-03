import type { Response } from 'express';
import { commentService } from '../services/comment.service';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from '../validators/comment.validator';

export const listTaskComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const comments = await commentService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, comments, 'Comments retrieved');
  },
);

export const createTaskComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const comment = await commentService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateCommentInput,
    );
    ApiResponse.success(res, comment, 'Comment created', 201);
  },
);

export const updateTaskComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const comment = await commentService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'commentId'),
      req.body as UpdateCommentInput,
    );
    ApiResponse.success(res, comment, 'Comment updated');
  },
);

export const deleteTaskComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await commentService.delete(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'commentId'),
    );
    ApiResponse.success(res, null, 'Comment deleted');
  },
);
