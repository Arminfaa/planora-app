import type { Response } from 'express';
import { projectGroupService } from '../services/project-group.service';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type { PaginationQuery } from '../utils/pagination';
import type {
  CreateGroupMessageInput,
  UpdateGroupMessageInput,
} from '../validators/project-group.validator';

export const listGroupMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const result = await projectGroupService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
      page,
      limit,
    );
    ApiResponse.success(res, result, 'Group messages retrieved');
  },
);

export const createGroupMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const message = await projectGroupService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateGroupMessageInput,
    );
    ApiResponse.success(res, message, 'Message sent', 201);
  },
);

export const createGroupMessageWithFile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const content =
      typeof req.body?.content === 'string' ? req.body.content : undefined;
    const message = await projectGroupService.createWithFile(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.file as Express.Multer.File,
      content,
    );
    ApiResponse.success(res, message, 'File uploaded', 201);
  },
);

export const updateGroupMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const message = await projectGroupService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'messageId'),
      req.body as UpdateGroupMessageInput,
    );
    ApiResponse.success(res, message, 'Message updated');
  },
);

export const deleteGroupMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await projectGroupService.delete(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'messageId'),
    );
    ApiResponse.success(res, null, 'Message deleted');
  },
);
