import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../validators/task.validator';

export class TaskService {
  private async generateUniqueSlug(
    boardId: string,
    title: string,
  ): Promise<string> {
    let slug = toSlug(title) || `task-${Date.now()}`;
    const existing = await taskRepository.findByBoardAndSlug(boardId, slug);

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return slug;
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

  async listByColumn(
    userId: string,
    columnId: string,
    page: number,
    limit: number,
  ) {
    const projectId = await this.resolveProjectIdFromColumn(columnId);
    await projectAccessService.ensureMember(userId, projectId);

    const { items, total } = await taskRepository.findByColumn(
      columnId,
      page,
      limit,
    );

    return buildPagination(items, total, page, limit);
  }

  async getById(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    return task;
  }

  async create(userId: string, columnId: string, input: CreateTaskInput) {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await this.resolveProjectIdFromColumn(columnId);
    await projectAccessService.ensureMember(userId, projectId);

    if (input.assigneeId) {
      await this.ensureAssigneeIsMember(projectId, input.assigneeId);
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
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      createdById: userId,
    });
  }

  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new ApiError(404, 'Task not found');
    }

    if (input.assigneeId) {
      await this.ensureAssigneeIsMember(projectId, input.assigneeId);
    }

    const isMove = input.columnId !== undefined || input.position !== undefined;

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
        const updated = await taskRepository.update(taskId, rest);
        if (!updated) {
          throw new ApiError(404, 'Task not found');
        }
        return updated;
      }

      return movedTask;
    }

    return taskRepository.update(taskId, input);
  }

  async delete(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);
    await taskRepository.delete(taskId);
  }
}

export const taskService = new TaskService();
