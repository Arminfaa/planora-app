import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { checklistRepository } from '../repositories/checklist.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../validators/checklist.validator';

export class ChecklistService {
  private async resolveProjectIdFromTask(taskId: string): Promise<string> {
    const columnId = await taskRepository.getColumnId(taskId);
    if (!columnId) {
      throw new ApiError(404, 'Task not found');
    }

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

  private async ensureTaskExists(taskId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    return task;
  }

  async list(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');
    return checklistRepository.findByTask(taskId);
  }

  async create(
    userId: string,
    taskId: string,
    input: CreateChecklistItemInput,
  ) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.edit');
    await this.ensureTaskExists(taskId);

    const position = await checklistRepository.getNextPosition(taskId);
    const item = await checklistRepository.create(
      taskId,
      input.title,
      position,
    );

    return { item, task: await taskRepository.findById(taskId) };
  }

  async update(
    userId: string,
    taskId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
  ) {
    const projectId = await this.resolveProjectIdFromTask(taskId);

    const isToggleOnly =
      input.isDone !== undefined &&
      input.title === undefined &&
      input.position === undefined;

    await projectAccessService.ensurePermission(
      userId,
      projectId,
      isToggleOnly ? 'task.view' : 'task.edit',
    );

    const item = await checklistRepository.findById(itemId);
    if (!item || item.taskId !== taskId) {
      throw new ApiError(404, 'Checklist item not found');
    }

    const updated = await checklistRepository.update(itemId, input);
    return {
      item: updated,
      task: await taskRepository.findById(taskId),
      previousItem: item,
    };
  }

  async delete(userId: string, taskId: string, itemId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.edit');

    const item = await checklistRepository.findById(itemId);
    if (!item || item.taskId !== taskId) {
      throw new ApiError(404, 'Checklist item not found');
    }

    await checklistRepository.delete(itemId);
    return {
      task: await taskRepository.findById(taskId),
      deletedItem: item,
    };
  }
}

export const checklistService = new ChecklistService();
