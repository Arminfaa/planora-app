import type { Translator } from '@/i18n/utils';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
  position: number;
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  columnId: string;
  position: number;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  completeDate?: string | null;
  progress?: number;
  parentTaskId?: string | null;
  isCompleted?: boolean;
  assigneeIds: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignees?: TaskAssignee[];
  checklistItems?: TaskChecklistItem[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  labels?: { label: { id: string; name: string; color: string } }[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  assigneeIds?: string[];
  columnId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  columnId?: string;
  position?: number;
  startDate?: string | null;
  dueDate?: string | null;
  progress?: number;
  parentTaskId?: string | null;
  assigneeIds?: string[];
  isCompleted?: boolean;
  completeDate?: string | null;
}

export const PRIORITY_OPTIONS: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const PRIORITY_LABEL_KEYS: Record<TaskPriority, string> = {
  LOW: 'tasks.priorityLabels.low',
  MEDIUM: 'tasks.priorityLabels.medium',
  HIGH: 'tasks.priorityLabels.high',
  URGENT: 'tasks.priorityLabels.urgent',
};

export function getPriorityStyles(
  t: Translator,
): Record<TaskPriority, { badge: string; label: string }> {
  return {
    LOW: { badge: PRIORITY_BADGES.LOW, label: t(PRIORITY_LABEL_KEYS.LOW) },
    MEDIUM: {
      badge: PRIORITY_BADGES.MEDIUM,
      label: t(PRIORITY_LABEL_KEYS.MEDIUM),
    },
    HIGH: { badge: PRIORITY_BADGES.HIGH, label: t(PRIORITY_LABEL_KEYS.HIGH) },
    URGENT: {
      badge: PRIORITY_BADGES.URGENT,
      label: t(PRIORITY_LABEL_KEYS.URGENT),
    },
  };
}

/** @deprecated Use getPriorityStyles(t) for translated labels */
export const priorityStyles: Record<
  TaskPriority,
  { badge: string; label: string }
> = {
  LOW: { badge: PRIORITY_BADGES.LOW, label: 'Low' },
  MEDIUM: { badge: PRIORITY_BADGES.MEDIUM, label: 'Medium' },
  HIGH: { badge: PRIORITY_BADGES.HIGH, label: 'High' },
  URGENT: { badge: PRIORITY_BADGES.URGENT, label: 'Urgent' },
};

export function getTaskAssignees(task: {
  assignees?: TaskAssignee[];
}): TaskAssignee[] {
  return task.assignees ?? [];
}

export function formatAssigneeNames(task: {
  assignees?: TaskAssignee[];
}): string {
  return getTaskAssignees(task)
    .map((assignee) => assignee.name)
    .join(', ');
}
