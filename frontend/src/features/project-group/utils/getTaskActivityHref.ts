import type { ProjectGroupMessage } from '../types';

const TASK_LINK_ACTIVITY_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.moved',
]);

export function getTaskActivityHref(
  message: ProjectGroupMessage,
  projectSlug: string,
): string | null {
  if (
    !message.activityType ||
    !TASK_LINK_ACTIVITY_TYPES.has(message.activityType)
  ) {
    return null;
  }

  const data = (message.activityData ?? {}) as Record<string, unknown>;
  const taskSlug = data.taskSlug;
  const boardSlug = data.boardSlug;

  if (typeof taskSlug !== 'string' || typeof boardSlug !== 'string') {
    return null;
  }

  return `/dashboard/projects/${projectSlug}/boards/${boardSlug}?task=${encodeURIComponent(taskSlug)}`;
}
