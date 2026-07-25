import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { projectBackupService } from '../services/project-backup.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';

export const exportProjectBackup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { filename, buffer } = await projectBackupService.exportProject(
      req.user!.userId,
      getParam(req.params, 'id'),
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  },
);

export const importProjectBackup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new ApiError(400, 'Backup file is required');
    }

    const result = await projectBackupService.importProject(
      req.user!.userId,
      file.buffer,
    );

    ApiResponse.success(res, result, 'Project backup imported', 201);
  },
);
