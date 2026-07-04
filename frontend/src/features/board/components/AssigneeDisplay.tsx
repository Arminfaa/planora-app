'use client';

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

  const tooltipId = `assignees-${people.map((person) => person.id).join('-')}`;

  return (
    <span
      className={`group/assignees relative inline-flex max-w-full items-center gap-0.5 ${className ?? ''}`}
      aria-describedby={tooltipId}
    >
      <span className="truncate">{people[0].name}</span>
      <span className="shrink-0 text-gray-400">+{people.length - 1}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 hidden whitespace-normal rounded-md bg-gray-900 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover/assignees:block"
      >
        {people.map((person) => (
          <span key={person.id} className="block">
            {person.name}
          </span>
        ))}
      </span>
    </span>
  );
}
