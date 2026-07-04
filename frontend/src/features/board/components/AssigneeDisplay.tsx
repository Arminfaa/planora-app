'use client';

import { Tooltip } from 'antd';
import type { TaskAssignee } from '@/features/tasks/types';
import { getTaskAssignees } from '@/features/tasks/types';

interface AssigneeDisplayProps {
  assignees?: TaskAssignee[];
  task?: { assignees?: TaskAssignee[] };
  className?: string;
}

export function AssigneeDisplay({
  assignees,
  task,
  className,
}: AssigneeDisplayProps) {
  const people = assignees ?? (task ? getTaskAssignees(task) : []);

  if (people.length === 0) return null;

  if (people.length === 1) {
    return <span className={className}>{people[0].name}</span>;
  }

  return (
    <Tooltip
      placement="topRight"
      title={
        <ul className="m-0 list-none space-y-0.5 p-0">
          {people.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      }
    >
      <span
        className={`inline-flex max-w-full cursor-default items-center gap-0.5 ${className ?? ''}`}
      >
        <span className="truncate">{people[0].name}</span>
        <span className="shrink-0 text-gray-400">+{people.length - 1}</span>
      </span>
    </Tooltip>
  );
}
