import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { projectService } from '../services/project.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '../validators/project.validator';
import { taskService } from '../services/task.service';
import type { PaginationQuery } from '../utils/pagination';

export const getPermissionCatalog = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const catalog = await projectService.getPermissionCatalog();
    ApiResponse.success(res, catalog, 'Permission catalog retrieved');
  },
);

export const listProjects = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;
    const result = await projectService.list(req.user!.userId, page, limit);
    ApiResponse.success(res, result, 'Projects retrieved');
  },
);

export const getProject = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const project = await projectService.getById(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, project, 'Project retrieved');
  },
);

export const getProjectProgress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const stats = await projectService.getProgressStats(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, stats, 'Project progress retrieved');
  },
);

export const getProjectGantt = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const gantt = await taskService.listGanttByProject(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, gantt, 'Project gantt retrieved');
  },
);

export const getProjectTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await taskService.listByProject(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, result, 'Project tasks retrieved');
  },
);

export const createProject = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const project = await projectService.create(
      req.user!.userId,
      req.body as CreateProjectInput,
    );
    ApiResponse.success(res, project, 'Project created', 201);
  },
);

export const updateProject = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const project = await projectService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as UpdateProjectInput,
    );
    ApiResponse.success(res, project, 'Project updated');
  },
);

export const deleteProject = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await projectService.delete(req.user!.userId, getParam(req.params, 'id'));
    ApiResponse.success(res, null, 'Project deleted');
  },
);
