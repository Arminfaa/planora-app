import type { BoardTask } from '@/features/board/types';

export function taskMatchesQuery(task: BoardTask, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const title = task.title.toLowerCase();
  const description = (task.description ?? '').toLowerCase();
  const assignee = task.assignee?.name.toLowerCase() ?? '';

  return (
    title.includes(normalized) ||
    description.includes(normalized) ||
    assignee.includes(normalized)
  );
}
