import type { Response } from 'express';
import { taskRepository } from '../repositories/task.repository';
import type { AuthenticatedRequest } from '../types';
import { taskService } from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { notifyBoardTaskEvent } from '../utils/board-events';
import type { PaginationQuery } from '../utils/pagination';
import { getParam } from '../utils/params';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../validators/task.validator';

export const listTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const result = await taskService.listByColumn(
      req.user!.userId,
      getParam(req.params, 'columnId'),
      page,
      limit,
    );
    ApiResponse.success(res, result, 'Tasks retrieved');
  },
);

export const getTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const task = await taskService.getById(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, task, 'Task retrieved');
  },
);

export const createTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const columnId = getParam(req.params, 'columnId');
    const task = await taskService.create(
      req.user!.userId,
      columnId,
      req.body as CreateTaskInput,
    );

    await notifyBoardTaskEvent(req.user!.userId, 'task:created', {
      columnId,
      payload: { task },
    });

    ApiResponse.success(res, task, 'Task created', 201);
  },
);

export const updateTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const input = req.body as UpdateTaskInput;
    const task = await taskService.update(req.user!.userId, taskId, input);

    const isMove = input.columnId !== undefined || input.position !== undefined;
    const eventType = isMove ? 'task:moved' : 'task:updated';

    await notifyBoardTaskEvent(req.user!.userId, eventType, {
      taskId,
      columnId: task.columnId,
      payload: { task },
    });

    ApiResponse.success(res, task, 'Task updated');
  },
);

export const deleteTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const columnId = await taskRepository.getColumnId(taskId);

    await taskService.delete(req.user!.userId, taskId);

    await notifyBoardTaskEvent(req.user!.userId, 'task:deleted', {
      columnId: columnId ?? undefined,
      taskId,
      payload: { taskId, columnId },
    });

    ApiResponse.success(res, null, 'Task deleted');
  },
);
