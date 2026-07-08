import { useMemo } from 'react';
import type { ProjectMember } from '@/features/projects/types';
import { getTaskAssignees } from '@/features/tasks/types';
import { buildMemberColorMap } from '@/features/tasks/utils/assigneeColors';

export function useMemberColorMap(
  members: ProjectMember[],
  tasks: Array<{ assignees?: { id: string }[] }> = [],
) {
  return useMemo(() => {
    const ids = new Set(members.map((member) => member.id));

    for (const task of tasks) {
      for (const assignee of getTaskAssignees(task)) {
        ids.add(assignee.id);
      }
    }

    return buildMemberColorMap(ids);
  }, [members, tasks]);
}
