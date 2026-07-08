'use client';

import { Tooltip } from 'antd';
import type { TaskAssignee } from '@/features/tasks/types';
import { getTaskAssignees } from '@/features/tasks/types';
import {
  getAssigneeColor,
  getPrimaryAssigneeId,
  type AssigneeColorTheme,
} from '@/features/tasks/utils/assigneeColors';

interface AssigneeDisplayProps {
  assignees?: TaskAssignee[];
  task?: { assignees?: TaskAssignee[] };
  className?: string;
  memberColorMap?: Map<string, AssigneeColorTheme>;
}

export function AssigneeDisplay({
  assignees,
  task,
  className = '',
  memberColorMap,
}: AssigneeDisplayProps) {
  const people = assignees ?? (task ? getTaskAssignees(task) : []);

  if (people.length === 0) return null;

  const primaryId = getPrimaryAssigneeId({ assignees: people });
  const accent =
    primaryId && memberColorMap
      ? getAssigneeColor(primaryId, memberColorMap)
      : null;

  const colorDot = accent ? (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: accent.accent }}
      aria-hidden
    />
  ) : null;

  if (people.length === 1) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {colorDot}
        <span>{people[0].name}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {colorDot}
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
        <span className="inline-flex max-w-full cursor-default items-center gap-0.5">
          <span className="truncate">{people[0].name}</span>
          <span className="shrink-0 text-gray-400">+{people.length - 1}</span>
        </span>
      </Tooltip>
    </span>
  );
}
