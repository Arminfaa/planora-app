import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { checklistRepository } from '../repositories/checklist.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import {
  computeChecklistProgress,
  DEFAULT_CHECKLIST_WEIGHT,
  normalizeChecklistWeight,
} from '../utils/checklist-progress';
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

  private async syncTaskProgressFromChecklist(taskId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    if (task.isCompleted) {
      if (task.progress !== 100) {
        return taskRepository.update(taskId, { progress: 100 });
      }
      return task;
    }

    const items = await checklistRepository.findByTask(taskId);
    if (items.length === 0) {
      return task;
    }

    const progress = computeChecklistProgress(items);
    if (task.progress === progress) {
      return task;
    }

    return taskRepository.update(taskId, { progress });
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
    const weight = normalizeChecklistWeight(
      input.weight ?? DEFAULT_CHECKLIST_WEIGHT,
    );
    const item = await checklistRepository.create(
      taskId,
      input.title,
      position,
      weight,
    );

    const task = await this.syncTaskProgressFromChecklist(taskId);
    return { item, task };
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
      input.position === undefined &&
      input.weight === undefined;

    await projectAccessService.ensurePermission(
      userId,
      projectId,
      isToggleOnly ? 'task.view' : 'task.edit',
    );

    const item = await checklistRepository.findById(itemId);
    if (!item || item.taskId !== taskId) {
      throw new ApiError(404, 'Checklist item not found');
    }

    const payload: {
      title?: string;
      isDone?: boolean;
      weight?: number;
      position?: number;
    } = {};

    if (input.title !== undefined) payload.title = input.title;
    if (input.isDone !== undefined) payload.isDone = input.isDone;
    if (input.position !== undefined) payload.position = input.position;
    if (input.weight !== undefined) {
      payload.weight = normalizeChecklistWeight(input.weight);
    }

    const updated = await checklistRepository.update(itemId, payload);
    const task = await this.syncTaskProgressFromChecklist(taskId);

    return {
      item: updated,
      task,
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
    const task = await this.syncTaskProgressFromChecklist(taskId);

    return {
      task,
      deletedItem: item,
    };
  }
}

export const checklistService = new ChecklistService();
