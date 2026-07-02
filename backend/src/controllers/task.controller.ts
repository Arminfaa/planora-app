import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { taskService } from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
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
    const task = await taskService.create(
      req.user!.userId,
      getParam(req.params, 'columnId'),
      req.body as CreateTaskInput,
    );
    ApiResponse.success(res, task, 'Task created', 201);
  },
);

export const updateTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const task = await taskService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as UpdateTaskInput,
    );
    ApiResponse.success(res, task, 'Task updated');
  },
);

export const deleteTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await taskService.delete(req.user!.userId, getParam(req.params, 'id'));
    ApiResponse.success(res, null, 'Task deleted');
  },
);
