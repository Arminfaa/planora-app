import type { NextFunction, Response } from 'express';
import { attachmentService } from '../services/attachment.service';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
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
    const attachment = await attachmentService.upload(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.file as Express.Multer.File,
    );
    ApiResponse.success(res, attachment, 'Attachment uploaded', 201);
  }),
];

export const deleteTaskAttachment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await attachmentService.delete(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'attachmentId'),
    );
    ApiResponse.success(res, null, 'Attachment deleted');
  },
);
