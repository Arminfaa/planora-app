import { prisma } from '../config/database';

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

async function findTaskBoardLinks(taskIds: string[]) {
  if (taskIds.length === 0) {
    return new Map<string, { taskSlug: string; boardSlug: string | undefined }>();
  }

  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds } },
    select: {
      id: true,
      slug: true,
      board: { select: { slug: true } },
    },
  });

  return new Map(
    tasks.map((task) => [
      task.id,
      { taskSlug: task.slug, boardSlug: task.board?.slug },
    ]),
  );
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

  const linkByTaskId = await findTaskBoardLinks([taskId]);
  const link = linkByTaskId.get(taskId);
  if (!link) {
    return activityData;
  }

  return {
    ...activityData,
    taskSlug: link.taskSlug,
    boardSlug: link.boardSlug,
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

  const linkByTaskId = await findTaskBoardLinks(taskIds);

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
