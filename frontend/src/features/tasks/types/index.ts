export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  columnId: string;
  position: number;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
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
  dueDate?: string;
  assigneeId?: string;
  columnId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  columnId?: string;
  position?: number;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export const PRIORITY_OPTIONS: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

export const priorityStyles: Record<
  TaskPriority,
  { badge: string; label: string }
> = {
  LOW: { badge: 'bg-gray-100 text-gray-700', label: 'Low' },
  MEDIUM: { badge: 'bg-blue-100 text-blue-700', label: 'Medium' },
  HIGH: { badge: 'bg-orange-100 text-orange-700', label: 'High' },
  URGENT: { badge: 'bg-red-100 text-red-700', label: 'Urgent' },
};
