import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { taskDependencyService } from '../services/task-dependency.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { emitProjectEvent } from '../socket';
import { getParam } from '../utils/params';
import type { CreateTaskDependencyInput } from '../validators/task-dependency.validator';

export const listProjectDependencies = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const dependencies = await taskDependencyService.listByProject(
      req.user!.userId,
      projectId,
    );
    ApiResponse.success(res, dependencies, 'Dependencies retrieved');
  },
);

export const listTaskDependencies = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const dependencies = await taskDependencyService.listByTask(
      req.user!.userId,
      taskId,
    );
    ApiResponse.success(res, dependencies, 'Task dependencies retrieved');
  },
);

export const createProjectDependency = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const dependency = await taskDependencyService.create(
      req.user!.userId,
      projectId,
      req.body as CreateTaskDependencyInput,
    );

    emitProjectEvent({
      projectId: dependency.projectId,
      type: 'task:dependency:created',
      userId: req.user!.userId,
      payload: { dependency },
    });

    ApiResponse.success(res, dependency, 'Dependency created', 201);
  },
);

export const deleteProjectDependency = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const dependencyId = getParam(req.params, 'dependencyId');
    const dependency = await taskDependencyService.delete(
      req.user!.userId,
      projectId,
      dependencyId,
    );

    emitProjectEvent({
      projectId: dependency.projectId,
      type: 'task:dependency:deleted',
      userId: req.user!.userId,
      payload: { dependencyId: dependency.id, dependency },
    });

    ApiResponse.success(res, null, 'Dependency deleted');
  },
);
