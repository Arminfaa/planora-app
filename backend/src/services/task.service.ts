import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import { projectMemberService } from './project-member.service';
import { serializeGanttTask } from '../utils/gantt-serializer';
import type {
  CreateBoardTaskInput,
  CreateTaskInput,
  UpdateTaskInput,
} from '../validators/task.validator';

export class TaskService {
  private async generateUniqueSlug(
    boardId: string,
    title: string,
    excludeTaskId?: string,
  ): Promise<string> {
    let slug = toSlug(title) || `task-${Date.now()}`;
    const existing = await taskRepository.findByBoardAndSlug(boardId, slug);

    if (existing && existing.id !== excludeTaskId) {
      slug = `${slug}-${Date.now()}`;
    }

    return slug;
  }

  private async withUpdatedSlug<T extends UpdateTaskInput>(
    existing: { id: string; boardId: string; title: string },
    input: T,
  ): Promise<T & { slug?: string }> {
    if (input.title === undefined || input.title === existing.title) {
      return input;
    }

    const slug = await this.generateUniqueSlug(
      existing.boardId,
      input.title,
      existing.id,
    );

    return { ...input, slug };
  }

  private async resolveProjectIdFromColumn(columnId: string): Promise<string> {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    return projectId;
  }

  private async resolveProjectIdFromTask(taskId: string): Promise<string> {
    const columnId = await taskRepository.getColumnId(taskId);
    if (!columnId) {
      throw new ApiError(404, 'Task not found');
    }
    return this.resolveProjectIdFromColumn(columnId);
  }

  private async ensureAssigneeIsMember(
    projectId: string,
    assigneeId: string,
  ): Promise<void> {
    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      assigneeId,
    );

    if (!membership) {
      throw new ApiError(400, 'Assignee must be a project member');
    }
  }

  private async ensureAssigneesAreMembers(
    projectId: string,
    assigneeIds: string[],
  ): Promise<void> {
    for (const assigneeId of assigneeIds) {
      await this.ensureAssigneeIsMember(projectId, assigneeId);
    }
  }

  async listByColumn(
    userId: string,
    columnId: string,
    page: number,
    limit: number,
  ) {
    const projectId = await this.resolveProjectIdFromColumn(columnId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const { items, total } = await taskRepository.findByColumn(
      columnId,
      page,
      limit,
    );

    return buildPagination(items, total, page, limit);
  }

  async getById(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    return task;
  }

  async listByBoard(userId: string, boardId: string) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(userId, projectId, 'task.view');
    return taskRepository.findByBoard(boardId);
  }

  private async resolveColumnForBoard(
    boardId: string,
    columnId?: string,
  ): Promise<{
    columnId: string;
    createdUnspecified: boolean;
    unspecifiedColumn?: Awaited<ReturnType<typeof columnRepository.findById>>;
  }> {
    if (columnId) {
      const column = await columnRepository.findById(columnId);
      if (!column || column.boardId !== boardId) {
        throw new ApiError(400, 'Invalid column for this board');
      }
      return { columnId, createdUnspecified: false };
    }

    const result = await columnRepository.getOrCreateUnspecifiedColumn(boardId);
    return {
      columnId: result.column.id,
      createdUnspecified: result.created,
      unspecifiedColumn: result.column,
    };
  }

  async createOnBoard(
    userId: string,
    boardId: string,
    input: CreateBoardTaskInput,
  ) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'task.create',
    );

    const { columnId, createdUnspecified, unspecifiedColumn } =
      await this.resolveColumnForBoard(boardId, input.columnId);

    if (input.assigneeIds?.length) {
      await this.ensureAssigneesAreMembers(projectId, input.assigneeIds);
    }

    const slug = await this.generateUniqueSlug(boardId, input.title);

    const task = await taskRepository.create({
      title: input.title,
      slug,
      description: input.description,
      columnId,
      boardId,
      position: input.position,
      priority: input.priority,
      startDate: input.startDate,
      dueDate: input.dueDate,
      assigneeIds: input.assigneeIds,
      createdById: userId,
    });

    return { task, columnId, createdUnspecified, unspecifiedColumn };
  }

  async create(userId: string, columnId: string, input: CreateTaskInput) {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await this.resolveProjectIdFromColumn(columnId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'task.create',
    );

    if (input.assigneeIds?.length) {
      await this.ensureAssigneesAreMembers(projectId, input.assigneeIds);
    }

    const slug = await this.generateUniqueSlug(boardId, input.title);

    return taskRepository.create({
      title: input.title,
      slug,
      description: input.description,
      columnId,
      boardId,
      position: input.position,
      priority: input.priority,
      startDate: input.startDate,
      dueDate: input.dueDate,
      assigneeIds: input.assigneeIds,
      createdById: userId,
    });
  }

  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    const projectId = await this.resolveProjectIdFromTask(taskId);

    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new ApiError(404, 'Task not found');
    }

    if (input.assigneeIds !== undefined) {
      await this.ensureAssigneesAreMembers(projectId, input.assigneeIds);
    }

    const isMove = input.columnId !== undefined || input.position !== undefined;
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      isMove ? 'task.move' : 'task.edit',
    );

    if (isMove) {
      const targetColumnId = input.columnId ?? existing.columnId;

      if (input.columnId) {
        const targetProjectId =
          await this.resolveProjectIdFromColumn(targetColumnId);
        if (targetProjectId !== projectId) {
          throw new ApiError(
            400,
            'Cannot move task to a column in another project',
          );
        }
      }

      const targetPosition = input.position ?? existing.position;
      const movedTask = await taskRepository.moveTask(
        taskId,
        targetColumnId,
        targetPosition,
      );

      if (!movedTask) {
        throw new ApiError(404, 'Task not found');
      }

      const { columnId: _columnId, position: _position, ...rest } = input;
      if (Object.keys(rest).length > 0) {
        const updatePayload = await this.withUpdatedSlug(existing, rest);
        const updated = await taskRepository.update(taskId, updatePayload);
        if (!updated) {
          throw new ApiError(404, 'Task not found');
        }
        return updated;
      }

      return movedTask;
    }

    const updatePayload = await this.withUpdatedSlug(existing, input);
    return taskRepository.update(taskId, updatePayload);
  }

  async delete(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'task.delete',
    );
    await taskRepository.delete(taskId);
  }

  async listGanttByProject(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const tasks = await taskRepository.findGanttByProject(projectId);
    const scheduled: ReturnType<typeof serializeGanttTask>[] = [];
    const unscheduled: ReturnType<typeof serializeGanttTask>[] = [];

    for (const task of tasks) {
      const item = serializeGanttTask(task);
      if (item.startDate || item.dueDate) {
        scheduled.push(item);
      } else {
        unscheduled.push(item);
      }
    }

    return { scheduled, unscheduled };
  }
}

export const taskService = new TaskService();
