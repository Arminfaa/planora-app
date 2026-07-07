import { ApiError } from '../utils/ApiError';
import { taskRepository } from '../repositories/task.repository';
import { columnRepository } from '../repositories/column.repository';
import { boardRepository } from '../repositories/board.repository';

export async function resolveTaskProjectId(taskId: string): Promise<string> {
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

export async function ensureTasksSameProject(
  taskId: string,
  otherTaskId: string,
): Promise<string> {
  const [projectId, otherProjectId] = await Promise.all([
    resolveTaskProjectId(taskId),
    resolveTaskProjectId(otherTaskId),
  ]);

  if (projectId !== otherProjectId) {
    throw new ApiError(400, 'Tasks must belong to the same project');
  }

  return projectId;
}

export async function wouldCreateParentCycle(
  taskId: string,
  parentTaskId: string,
): Promise<boolean> {
  if (taskId === parentTaskId) {
    return true;
  }

  let current: string | null = parentTaskId;

  while (current) {
    if (current === taskId) {
      return true;
    }

    const parent = await taskRepository.findParentId(current);
    current = parent;
  }

  return false;
}
