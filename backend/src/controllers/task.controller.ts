import type { Response } from 'express';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import type { AuthenticatedRequest } from '../types';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import { taskService } from '../services/task.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
  notifyBoardColumnEvent,
  notifyBoardTaskEvent,
} from '../utils/board-events';
import { buildTaskActivityChanges } from '../utils/project-group-activity';
import type { PaginationQuery } from '../utils/pagination';
import { getParam } from '../utils/params';
import type {
  CreateBoardTaskInput,
  CreateTaskInput,
  UpdateTaskInput,
  BulkMoveTasksInput,
} from '../validators/task.validator';

export const listBoardTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const tasks = await taskService.listByBoard(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, tasks, 'Tasks retrieved');
  },
);

export const createBoardTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'id');
    const { task, columnId, createdUnspecified, unspecifiedColumn } =
      await taskService.createOnBoard(
        req.user!.userId,
        boardId,
        req.body as CreateBoardTaskInput,
      );

    if (createdUnspecified && unspecifiedColumn) {
      await notifyBoardColumnEvent(req.user!.userId, 'column:created', {
        boardId,
        columnId: unspecifiedColumn.id,
        payload: { column: unspecifiedColumn },
      });
    }

    await notifyBoardTaskEvent(req.user!.userId, 'task:created', {
      columnId,
      payload: { task },
    });

    const projectId = await boardRepository.getProjectId(boardId);
    if (projectId) {
      const board = await boardRepository.findById(boardId);
      void projectGroupActivityService.logTaskCreated(
        req.user!.userId,
        projectId,
        {
          taskId: task.id,
          taskTitle: task.title,
          boardName: board?.name,
        },
      );
    }

    ApiResponse.success(res, task, 'Task created', 201);
  },
);

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

    const boardId = await columnRepository.getBoardId(columnId);
    if (boardId) {
      const projectId = await boardRepository.getProjectId(boardId);
      if (projectId) {
        const board = await boardRepository.findById(boardId);
        void projectGroupActivityService.logTaskCreated(
          req.user!.userId,
          projectId,
          {
            taskId: task.id,
            taskTitle: task.title,
            boardName: board?.name,
          },
        );
      }
    }

    ApiResponse.success(res, task, 'Task created', 201);
  },
);

export const updateTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const input = req.body as UpdateTaskInput;
    const existing = await taskRepository.findById(taskId);
    const task = await taskService.update(req.user!.userId, taskId, input);

    const isMove = input.columnId !== undefined || input.position !== undefined;
    const eventType = isMove ? 'task:moved' : 'task:updated';

    let movePayload: Record<string, unknown> = { task };
    if (isMove && input.columnId && input.columnId !== existing?.columnId) {
      const fromColumn = await columnRepository.findById(existing!.columnId);
      const toColumn = await columnRepository.findById(input.columnId);
      movePayload = {
        task,
        fromColumnName: fromColumn?.name,
        toColumnName: toColumn?.name,
      };
    }

    await notifyBoardTaskEvent(req.user!.userId, eventType, {
      taskId,
      columnId: task.columnId,
      payload: movePayload,
    });

    if (existing) {
      const boardId = await columnRepository.getBoardId(existing.columnId);
      const projectId = boardId
        ? await boardRepository.getProjectId(boardId)
        : null;

      if (projectId) {
        if (isMove && input.columnId && input.columnId !== existing.columnId) {
          const fromColumn = await columnRepository.findById(existing.columnId);
          const toColumn = await columnRepository.findById(input.columnId);
          void projectGroupActivityService.logTaskMoved(
            req.user!.userId,
            projectId,
            {
              taskId: task.id,
              taskTitle: task.title,
              fromColumn: fromColumn?.name,
              toColumn: toColumn?.name,
            },
          );
        } else if (!isMove) {
          const changes = buildTaskActivityChanges(existing, input, task);
          void projectGroupActivityService.logTaskUpdated(
            req.user!.userId,
            projectId,
            {
              taskId: task.id,
              taskTitle: task.title,
              changes,
            },
          );
        } else if (isMove) {
          const changes = buildTaskActivityChanges(existing, input, task);
          if (changes.length > 0) {
            void projectGroupActivityService.logTaskUpdated(
              req.user!.userId,
              projectId,
              {
                taskId: task.id,
                taskTitle: task.title,
                changes,
              },
            );
          }
        }
      }
    }

    ApiResponse.success(res, task, 'Task updated');
  },
);

export const bulkMoveBoardTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const boardId = getParam(req.params, 'id');
    const { taskIds, columnId } = req.body as BulkMoveTasksInput;

    const tasks = await taskService.bulkMoveToColumn(
      req.user!.userId,
      boardId,
      taskIds,
      columnId,
    );

    await notifyBoardTaskEvent(req.user!.userId, 'task:moved', {
      columnId,
      payload: { tasks },
    });

    const projectId = await boardRepository.getProjectId(boardId);
    if (projectId) {
      const toColumn = await columnRepository.findById(columnId);
      for (const task of tasks) {
        void projectGroupActivityService.logTaskMoved(
          req.user!.userId,
          projectId,
          {
            taskId: task.id,
            taskTitle: task.title,
            toColumn: toColumn?.name,
          },
        );
      }
    }

    ApiResponse.success(res, tasks, 'Tasks moved');
  },
);

export const deleteTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const taskId = getParam(req.params, 'id');
    const existing = await taskRepository.findById(taskId);
    const columnId = await taskRepository.getColumnId(taskId);

    await taskService.delete(req.user!.userId, taskId);

    if (existing) {
      await notifyBoardTaskEvent(req.user!.userId, 'task:deleted', {
        columnId: columnId ?? undefined,
        taskId,
        payload: {
          task: {
            id: existing.id,
            slug: existing.slug,
            title: existing.title,
          },
        },
      });
    }

    if (existing && columnId) {
      const boardId = await columnRepository.getBoardId(columnId);
      const projectId = boardId
        ? await boardRepository.getProjectId(boardId)
        : null;
      if (projectId) {
        void projectGroupActivityService.logTaskDeleted(
          req.user!.userId,
          projectId,
          { taskId, taskTitle: existing.title },
        );
      }
    }

    ApiResponse.success(res, null, 'Task deleted');
  },
);
