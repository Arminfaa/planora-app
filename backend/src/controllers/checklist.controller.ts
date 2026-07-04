import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { checklistService } from '../services/checklist.service';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { notifyBoardTaskEvent } from '../utils/board-events';
import {
  buildChecklistActivityChanges,
  buildChecklistCreatedChange,
  buildChecklistDeletedChange,
} from '../utils/project-group-activity';
import { getParam } from '../utils/params';
import type {
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../validators/checklist.validator';

export const listChecklistItems = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const items = await checklistService.list(req.user!.userId, taskId);
    ApiResponse.success(res, items, 'Checklist retrieved');
  },
);

export const createChecklistItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const result = await checklistService.create(
      req.user!.userId,
      taskId,
      req.body as CreateChecklistItemInput,
    );

    if (result.task) {
      await notifyBoardTaskEvent(req.user!.userId, 'task:updated', {
        taskId,
        columnId: result.task.columnId,
        payload: { task: result.task },
      });
    }

    void projectGroupActivityService.logTaskActivityByTaskId(
      req.user!.userId,
      taskId,
      [buildChecklistCreatedChange(result.item.title)],
      result.task?.title,
    );

    ApiResponse.success(res, result.item, 'Checklist item created', 201);
  },
);

export const updateChecklistItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const itemId = getParam(req.params, 'itemId');
    const result = await checklistService.update(
      req.user!.userId,
      taskId,
      itemId,
      req.body as UpdateChecklistItemInput,
    );

    if (result.task) {
      await notifyBoardTaskEvent(req.user!.userId, 'task:updated', {
        taskId,
        columnId: result.task.columnId,
        payload: { task: result.task },
      });
    }

    if (result.previousItem) {
      const changes = buildChecklistActivityChanges(
        result.previousItem,
        req.body as UpdateChecklistItemInput,
        result.item,
      );
      void projectGroupActivityService.logTaskActivityByTaskId(
        req.user!.userId,
        taskId,
        changes,
        result.task?.title,
      );
    }

    ApiResponse.success(res, result.item, 'Checklist item updated');
  },
);

export const deleteChecklistItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const itemId = getParam(req.params, 'itemId');
    const result = await checklistService.delete(
      req.user!.userId,
      taskId,
      itemId,
    );

    if (result.task) {
      await notifyBoardTaskEvent(req.user!.userId, 'task:updated', {
        taskId,
        columnId: result.task.columnId,
        payload: { task: result.task },
      });
    }

    if (result.deletedItem) {
      void projectGroupActivityService.logTaskActivityByTaskId(
        req.user!.userId,
        taskId,
        [buildChecklistDeletedChange(result.deletedItem.title)],
        result.task?.title,
      );
    }

    ApiResponse.success(res, null, 'Checklist item deleted');
  },
);
