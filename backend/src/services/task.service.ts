import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { taskRepository } from '../repositories/task.repository';
import { checklistRepository } from '../repositories/checklist.repository';
import { labelRepository } from '../repositories/label.repository';
import { taskDependencyRepository } from '../repositories/task-dependency.repository';
import { projectAccessService } from './project-access.service';
import { projectMemberService } from './project-member.service';
import { serializeGanttTask } from '../utils/gantt-serializer';
import {
  computeChecklistProgress,
  DEFAULT_CHECKLIST_WEIGHT,
  normalizeChecklistWeight,
} from '../utils/checklist-progress';
import {
  ensureTasksSameProject,
  wouldCreateParentCycle,
} from '../utils/task-hierarchy';
import { serializeTaskDependency } from '../utils/task-dependency-serializer';
import type {
  BulkTaskActionInput,
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

  async listByProject(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const [tasks, boards] = await Promise.all([
      taskRepository.findByProject(projectId),
      boardRepository.findByProjectWithColumns(projectId),
    ]);

    return { tasks, boards };
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

    if (input.parentTaskId) {
      await ensureTasksSameProject(taskId, input.parentTaskId);
      if (await wouldCreateParentCycle(taskId, input.parentTaskId)) {
        throw new ApiError(
          400,
          'This parent would create a circular hierarchy',
        );
      }
    }

    let normalizedInput: UpdateTaskInput = { ...input };
    let autoCompleteSuppressed: boolean | undefined;

    const checklistItems = await checklistRepository.findByTask(taskId);
    const hasChecklist = checklistItems.length > 0;

    if (input.isCompleted === true) {
      if (hasChecklist) {
        await checklistRepository.markAllDone(taskId);
      }
      autoCompleteSuppressed = false;
      normalizedInput = {
        ...normalizedInput,
        progress: 100,
        completeDate:
          input.completeDate === undefined ? new Date() : input.completeDate,
      };
    } else if (input.isCompleted === false) {
      autoCompleteSuppressed = hasChecklist;
      normalizedInput = {
        ...normalizedInput,
        completeDate: null,
        ...(hasChecklist
          ? { progress: computeChecklistProgress(checklistItems) }
          : {}),
      };
    } else if (input.progress !== undefined && hasChecklist) {
      normalizedInput = {
        ...normalizedInput,
        progress: computeChecklistProgress(checklistItems),
      };
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

      const {
        columnId: _columnId,
        position: _position,
        ...rest
      } = normalizedInput;
      if (
        Object.keys(rest).length > 0 ||
        autoCompleteSuppressed !== undefined
      ) {
        const updatePayload = await this.withUpdatedSlug(existing, rest);
        const updated = await taskRepository.update(taskId, {
          ...updatePayload,
          ...(autoCompleteSuppressed !== undefined
            ? { autoCompleteSuppressed }
            : {}),
        });
        if (!updated) {
          throw new ApiError(404, 'Task not found');
        }
        return updated;
      }

      return movedTask;
    }

    const updatePayload = await this.withUpdatedSlug(existing, normalizedInput);
    return taskRepository.update(taskId, {
      ...updatePayload,
      ...(autoCompleteSuppressed !== undefined
        ? { autoCompleteSuppressed }
        : {}),
    });
  }

  async bulkMoveToColumn(
    userId: string,
    boardId: string,
    taskIds: string[],
    columnId: string,
  ) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(userId, projectId, 'task.move');

    const targetColumn = await columnRepository.findById(columnId);
    if (!targetColumn || targetColumn.boardId !== boardId) {
      throw new ApiError(400, 'Invalid target column for this board');
    }

    const uniqueIds = [...new Set(taskIds)];
    if (uniqueIds.length === 0) {
      throw new ApiError(400, 'No tasks selected');
    }

    const existingTasks = await taskRepository.findBoardMembership(uniqueIds);

    if (existingTasks.length !== uniqueIds.length) {
      throw new ApiError(404, 'Some tasks were not found');
    }

    if (existingTasks.some((task) => task.boardId !== boardId)) {
      throw new ApiError(400, 'Some tasks do not belong to this board');
    }

    try {
      return await taskRepository.bulkMoveTasks(uniqueIds, columnId);
    } catch (error) {
      if (error instanceof Error && error.message === 'TASK_NOT_FOUND') {
        throw new ApiError(404, 'Some tasks were not found');
      }
      throw error;
    }
  }

  private async ensureBoardTasks(boardId: string, taskIds: string[]) {
    const uniqueIds = [...new Set(taskIds)];
    if (uniqueIds.length === 0) {
      throw new ApiError(400, 'No tasks selected');
    }

    const existingTasks = await taskRepository.findBoardMembership(uniqueIds);
    if (existingTasks.length !== uniqueIds.length) {
      throw new ApiError(404, 'Some tasks were not found');
    }
    if (existingTasks.some((task) => task.boardId !== boardId)) {
      throw new ApiError(400, 'Some tasks do not belong to this board');
    }

    return uniqueIds;
  }

  private async ensureProjectLabels(projectId: string, labelIds: string[]) {
    const uniqueLabelIds = [...new Set(labelIds)];
    for (const labelId of uniqueLabelIds) {
      const label = await labelRepository.findById(labelId);
      if (!label || label.projectId !== projectId) {
        throw new ApiError(400, 'Invalid label for this project');
      }
    }
    return uniqueLabelIds;
  }

  async bulkAction(
    userId: string,
    boardId: string,
    input: BulkTaskActionInput,
  ) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    const { action } = input;
    const permission =
      action.type === 'move'
        ? 'task.move'
        : action.type === 'delete'
          ? 'task.delete'
          : action.type === 'addLabels' ||
              action.type === 'removeLabels' ||
              action.type === 'setLabels'
            ? 'label.assign'
            : 'task.edit';

    await projectAccessService.ensurePermission(userId, projectId, permission);

    const uniqueIds = await this.ensureBoardTasks(boardId, input.taskIds);

    if (action.type === 'move') {
      return this.bulkMoveToColumn(userId, boardId, uniqueIds, action.columnId);
    }

    if (action.type === 'delete') {
      const existing = await taskRepository.findByIds(uniqueIds);
      for (const taskId of uniqueIds) {
        await taskRepository.delete(taskId);
      }
      return existing;
    }

    if (action.type === 'addChecklistItem') {
      const weight = normalizeChecklistWeight(
        action.weight ?? DEFAULT_CHECKLIST_WEIGHT,
      );
      for (const taskId of uniqueIds) {
        const position = await checklistRepository.getNextPosition(taskId);
        await checklistRepository.create(
          taskId,
          action.title,
          position,
          weight,
        );

        const task = await taskRepository.findById(taskId);
        if (!task || task.isCompleted) continue;

        const items = await checklistRepository.findByTask(taskId);
        const progress = computeChecklistProgress(items);
        const clearSuppress = progress < 100 && task.autoCompleteSuppressed;
        if (task.progress !== progress || clearSuppress) {
          await taskRepository.update(taskId, {
            progress,
            ...(clearSuppress ? { autoCompleteSuppressed: false } : {}),
          });
        }
      }
      return taskRepository.findByIds(uniqueIds);
    }

    if (
      action.type === 'addLabels' ||
      action.type === 'removeLabels' ||
      action.type === 'setLabels'
    ) {
      const labelIds = await this.ensureProjectLabels(
        projectId,
        action.labelIds,
      );

      for (const taskId of uniqueIds) {
        if (action.type === 'setLabels') {
          const current = await taskRepository.findById(taskId);
          const currentIds = new Set(
            (current?.labels ?? []).map(
              (entry: { label: { id: string } }) => entry.label.id,
            ),
          );
          for (const labelId of currentIds) {
            if (!labelIds.includes(labelId)) {
              await labelRepository.removeFromTask(taskId, labelId);
            }
          }
          for (const labelId of labelIds) {
            if (!currentIds.has(labelId)) {
              await labelRepository.assignToTask(taskId, labelId);
            }
          }
          continue;
        }

        for (const labelId of labelIds) {
          if (action.type === 'addLabels') {
            const existing = await labelRepository.findTaskLabel(
              taskId,
              labelId,
            );
            if (!existing) {
              await labelRepository.assignToTask(taskId, labelId);
            }
          } else {
            await labelRepository.removeFromTask(taskId, labelId);
          }
        }
      }

      return taskRepository.findByIds(uniqueIds);
    }

    let patch: UpdateTaskInput;
    switch (action.type) {
      case 'setDueDate':
        patch = { dueDate: action.dueDate };
        break;
      case 'setStartDate':
        patch = { startDate: action.startDate };
        break;
      case 'setCompleteDate':
        patch =
          action.completeDate === null
            ? { completeDate: null }
            : {
                completeDate: action.completeDate,
                isCompleted: true,
                progress: 100,
              };
        break;
      case 'setAssignees':
        patch = { assigneeIds: action.assigneeIds };
        break;
      case 'setPriority':
        patch = { priority: action.priority };
        break;
      case 'setCompleted':
        patch = { isCompleted: action.isCompleted };
        break;
      case 'setProgress':
        patch = { progress: action.progress };
        break;
      default:
        throw new ApiError(400, 'Unsupported bulk action');
    }

    for (const taskId of uniqueIds) {
      await this.update(userId, taskId, patch);
    }

    return taskRepository.findByIds(uniqueIds);
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
    const childCountByParent = new Map<string, number>();

    for (const task of tasks) {
      if (task.parentTaskId) {
        childCountByParent.set(
          task.parentTaskId,
          (childCountByParent.get(task.parentTaskId) ?? 0) + 1,
        );
      }
    }

    const scheduled: ReturnType<typeof serializeGanttTask>[] = [];
    const unscheduled: ReturnType<typeof serializeGanttTask>[] = [];

    for (const task of tasks) {
      const item = serializeGanttTask({
        ...task,
        childCount: childCountByParent.get(task.id) ?? 0,
      });
      if (item.startDate || item.dueDate) {
        scheduled.push(item);
      } else {
        unscheduled.push(item);
      }
    }

    const dependencies = (
      await taskDependencyRepository.findByProject(projectId)
    ).map(serializeTaskDependency);

    return { scheduled, unscheduled, dependencies };
  }
}

export const taskService = new TaskService();
