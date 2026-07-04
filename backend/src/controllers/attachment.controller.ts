import type { NextFunction, Response } from 'express';
import { attachmentService } from '../services/attachment.service';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
  buildAttachmentDeletedChange,
  buildAttachmentUploadedChange,
} from '../utils/project-group-activity';
import { getParam } from '../utils/params';
import { uploadMiddleware } from '../middlewares/upload.middleware';

export const listTaskAttachments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const attachments = await attachmentService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, attachments, 'Attachments retrieved');
  },
);

export const uploadTaskAttachment = [
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const attachment = await attachmentService.upload(
      req.user!.userId,
      taskId,
      req.file as Express.Multer.File,
    );

    void projectGroupActivityService.logTaskActivityByTaskId(
      req.user!.userId,
      taskId,
      [buildAttachmentUploadedChange(attachment.filename)],
    );

    ApiResponse.success(res, attachment, 'Attachment uploaded', 201);
  }),
];

export const deleteTaskAttachment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const filename = await attachmentService.delete(
      req.user!.userId,
      taskId,
      getParam(req.params, 'attachmentId'),
    );

    void projectGroupActivityService.logTaskActivityByTaskId(
      req.user!.userId,
      taskId,
      [buildAttachmentDeletedChange(filename)],
    );

    ApiResponse.success(res, null, 'Attachment deleted');
  },
);
