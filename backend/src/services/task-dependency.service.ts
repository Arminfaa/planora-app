import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskDependencyRepository } from '../repositories/task-dependency.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import { projectMemberService } from './project-member.service';
import { serializeTaskDependency } from '../utils/task-dependency-serializer';
import type { CreateTaskDependencyInput } from '../validators/task-dependency.validator';

export class TaskDependencyService {
  private async resolveTaskProjectId(taskId: string): Promise<string> {
    const columnId = await taskRepository.getColumnId(taskId);
    if (!columnId) {
      throw new ApiError(404, 'Task not found');
    }

    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Task not found');
    }

    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Task not found');
    }

    return projectId;
  }

  private async ensureTasksInProject(
    projectId: string,
    fromTaskId: string,
    toTaskId: string,
  ): Promise<void> {
    const [fromProjectId, toProjectId] = await Promise.all([
      this.resolveTaskProjectId(fromTaskId),
      this.resolveTaskProjectId(toTaskId),
    ]);

    if (fromProjectId !== projectId || toProjectId !== projectId) {
      throw new ApiError(400, 'Both tasks must belong to this project');
    }
  }

  private async wouldCreateCycle(
    projectId: string,
    fromTaskId: string,
    toTaskId: string,
  ): Promise<boolean> {
    if (fromTaskId === toTaskId) return true;

    const edges = await taskDependencyRepository.listEdgesByProject(projectId);
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      const next = adjacency.get(edge.fromTaskId) ?? [];
      next.push(edge.toTaskId);
      adjacency.set(edge.fromTaskId, next);
    }

    const next = adjacency.get(fromTaskId) ?? [];
    next.push(toTaskId);
    adjacency.set(fromTaskId, next);

    const visited = new Set<string>();
    const stack = [toTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === fromTaskId) {
        return true;
      }
      if (visited.has(current)) continue;
      visited.add(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        stack.push(neighbor);
      }
    }

    return false;
  }

  async listByProject(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const dependencies =
      await taskDependencyRepository.findByProject(projectId);
    return dependencies.map(serializeTaskDependency);
  }

  async listByTask(userId: string, taskId: string) {
    const projectId = await this.resolveTaskProjectId(taskId);
    await projectAccessService.ensurePermission(userId, projectId, 'task.view');

    const dependencies = await taskDependencyRepository.findByTask(taskId);
    const predecessors = dependencies
      .filter((dependency) => dependency.toTaskId === taskId)
      .map(serializeTaskDependency);
    const successors = dependencies
      .filter((dependency) => dependency.fromTaskId === taskId)
      .map(serializeTaskDependency);

    return { predecessors, successors };
  }

  async create(
    userId: string,
    projectIdOrSlug: string,
    input: CreateTaskDependencyInput,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'task.edit');

    const { fromTaskId, toTaskId } = input;

    await this.ensureTasksInProject(projectId, fromTaskId, toTaskId);

    const existing = await taskDependencyRepository.findEdge(
      fromTaskId,
      toTaskId,
    );
    if (existing) {
      throw new ApiError(409, 'This dependency already exists');
    }

    if (await this.wouldCreateCycle(projectId, fromTaskId, toTaskId)) {
      throw new ApiError(400, 'This dependency would create a circular chain');
    }

    const dependency = await taskDependencyRepository.create({
      projectId,
      fromTaskId,
      toTaskId,
      createdById: userId,
    });

    return serializeTaskDependency(dependency);
  }

  async delete(userId: string, projectIdOrSlug: string, dependencyId: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'task.edit');

    const dependency = await taskDependencyRepository.findById(dependencyId);
    if (!dependency || dependency.projectId !== projectId) {
      throw new ApiError(404, 'Dependency not found');
    }

    const deleted = await taskDependencyRepository.delete(dependencyId);
    return serializeTaskDependency(deleted);
  }
}

export const taskDependencyService = new TaskDependencyService();
