import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../validators/task.validator';

export class TaskService {
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
    const projectId = await this.resolveProjectIdFromColumn(columnId);
    await projectAccessService.ensureMember(userId, projectId);

    return taskRepository.create({
      title: input.title,
      description: input.description,
      columnId,
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

    if (input.columnId) {
      const targetProjectId = await this.resolveProjectIdFromColumn(
        input.columnId,
      );
      if (targetProjectId !== projectId) {
        throw new ApiError(
          400,
          'Cannot move task to a column in another project',
        );
      }
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
