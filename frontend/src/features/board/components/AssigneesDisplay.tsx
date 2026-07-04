'use client';

import type { TaskAssignee } from '@/features/tasks/types';
import { getTaskAssignees } from '@/features/tasks/types';

interface AssigneesDisplayProps {
  assignees?: TaskAssignee[];
  task?: { assignees?: TaskAssignee[] };
  className?: string;
  emptyLabel?: string;
  showEmpty?: boolean;
}

export function AssigneesDisplay({
  assignees,
  task,
  className = 'text-xs text-gray-500',
  emptyLabel,
  showEmpty = false,
}: AssigneesDisplayProps) {
  const list = assignees ?? (task ? getTaskAssignees(task) : []);

  if (list.length === 0) {
    if (showEmpty && emptyLabel) {
      return <span className={className}>{emptyLabel}</span>;
    }
    return null;
  }

  const tooltip = list.map((assignee) => assignee.name).join(', ');

  if (list.length === 1) {
    return (
      <span className={className} title={tooltip}>
        {list[0].name}
      </span>
    );
  }

  return (
    <span className={className} title={tooltip}>
      {list[0].name}{' '}
      <span className="font-medium text-gray-400">+{list.length - 1}</span>
    </span>
  );
}
