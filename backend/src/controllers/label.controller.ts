import type { Response } from 'express';
import { labelService } from '../services/label.service';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  CreateLabelInput,
  UpdateLabelInput,
} from '../validators/label.validator';

interface AssignTaskLabelInput {
  labelId: string;
}

export const listProjectLabels = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const labels = await labelService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, labels, 'Labels retrieved');
  },
);

export const createProjectLabel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const label = await labelService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateLabelInput,
    );
    ApiResponse.success(res, label, 'Label created', 201);
  },
);

export const updateProjectLabel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const label = await labelService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'labelId'),
      req.body as UpdateLabelInput,
    );
    ApiResponse.success(res, label, 'Label updated');
  },
);

export const deleteProjectLabel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await labelService.delete(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'labelId'),
    );
    ApiResponse.success(res, null, 'Label deleted');
  },
);

export const assignTaskLabel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const label = await labelService.assignToTask(
      req.user!.userId,
      getParam(req.params, 'id'),
      (req.body as AssignTaskLabelInput).labelId,
    );
    ApiResponse.success(res, label, 'Label assigned', 201);
  },
);

export const removeTaskLabel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await labelService.removeFromTask(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'labelId'),
    );
    ApiResponse.success(res, null, 'Label removed');
  },
);
