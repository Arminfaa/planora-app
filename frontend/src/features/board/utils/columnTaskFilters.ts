import type { BoardTask } from '../types';
import { getTaskAssignees } from '@/features/tasks/types';
import { UNASSIGNED_ASSIGNEE } from '@/features/search/types/filter';

export function taskMatchesColumnQuery(task: BoardTask, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const checklistText = (task.checklistItems ?? [])
    .flatMap((item) => [
      item.title,
      item.isDone ? 'checked done complete completed' : 'unchecked todo open',
    ])
    .join(' ')
    .toLowerCase();

  return (
    task.title.toLowerCase().includes(normalized) ||
    (task.description ?? '').toLowerCase().includes(normalized) ||
    checklistText.includes(normalized)
  );
}

export function taskMatchesColumnAssignee(
  task: BoardTask,
  assigneeId: string | null,
): boolean {
  if (!assigneeId) return true;

  const assignees = getTaskAssignees(task);
  if (assigneeId === UNASSIGNED_ASSIGNEE) {
    return assignees.length === 0;
  }

  return assignees.some((assignee) => assignee.id === assigneeId);
}

export function taskMatchesColumnFilters(
  task: BoardTask,
  query: string,
  assigneeId: string | null,
): boolean {
  return (
    taskMatchesColumnQuery(task, query) &&
    taskMatchesColumnAssignee(task, assigneeId)
  );
}
