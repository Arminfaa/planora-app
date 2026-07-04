'use client';

import { Tooltip } from 'antd';
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

  if (list.length === 1) {
    return <span className={className}>{list[0].name}</span>;
  }

  return (
    <Tooltip
      placement="topRight"
      title={
        <ul className="m-0 list-none space-y-0.5 p-0">
          {list.map((assignee) => (
            <li key={assignee.id}>{assignee.name}</li>
          ))}
        </ul>
      }
    >
      <span
        className={`inline-flex max-w-full cursor-default items-center gap-0.5 ${className}`}
      >
        {list[0].name}{' '}
        <span className="font-medium text-gray-400">+{list.length - 1}</span>
      </span>
    </Tooltip>
  );
}
