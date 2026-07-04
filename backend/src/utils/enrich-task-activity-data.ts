import { boardRepository } from '../repositories/board.repository';
import { taskRepository } from '../repositories/task.repository';

const TASK_LINK_ACTIVITY_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.moved',
]);

export function isTaskLinkActivityType(
  activityType: string | null | undefined,
): boolean {
  return Boolean(activityType && TASK_LINK_ACTIVITY_TYPES.has(activityType));
}

export async function enrichTaskActivityData<T extends Record<string, unknown>>(
  activityType: string | null | undefined,
  activityData: T,
): Promise<T> {
  if (!isTaskLinkActivityType(activityType)) {
    return activityData;
  }

  const taskId = activityData.taskId;
  if (typeof taskId !== 'string') {
    return activityData;
  }

  if (
    typeof activityData.taskSlug === 'string' &&
    typeof activityData.boardSlug === 'string'
  ) {
    return activityData;
  }

  const task = await taskRepository.findById(taskId);
  if (!task) {
    return activityData;
  }

  const board = await boardRepository.findById(task.boardId);

  return {
    ...activityData,
    taskSlug: task.slug,
    boardSlug: board?.slug,
  };
}

export async function enrichTaskActivityDataBatch(
  entries: Array<{
    activityType: string | null;
    activityData: Record<string, unknown>;
  }>,
): Promise<void> {
  const taskIds = [
    ...new Set(
      entries
        .filter(({ activityType, activityData }) => {
          if (!isTaskLinkActivityType(activityType)) return false;
          if (
            typeof activityData.taskSlug === 'string' &&
            typeof activityData.boardSlug === 'string'
          ) {
            return false;
          }
          return typeof activityData.taskId === 'string';
        })
        .map(({ activityData }) => activityData.taskId as string),
    ),
  ];

  if (taskIds.length === 0) return;

  const linkByTaskId = new Map<
    string,
    { taskSlug: string; boardSlug: string | undefined }
  >();

  await Promise.all(
    taskIds.map(async (taskId) => {
      const task = await taskRepository.findById(taskId);
      if (!task) return;

      const board = await boardRepository.findById(task.boardId);
      linkByTaskId.set(taskId, {
        taskSlug: task.slug,
        boardSlug: board?.slug,
      });
    }),
  );

  for (const entry of entries) {
    if (!isTaskLinkActivityType(entry.activityType)) continue;

    const taskId = entry.activityData.taskId;
    if (typeof taskId !== 'string') continue;

    const link = linkByTaskId.get(taskId);
    if (!link) continue;

    entry.activityData.taskSlug = link.taskSlug;
    entry.activityData.boardSlug = link.boardSlug;
  }
}
