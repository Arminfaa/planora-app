import type { TaskPriority } from '@/features/tasks/types';

export interface BoardColumn {
  id: string;
  name: string;
  boardId: string;
  position: number;
  color: string | null;
  tasks?: BoardTask[];
}

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  position: number;
  priority: TaskPriority;
  dueDate: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  columns?: BoardColumn[];
  _count?: { columns: number };
}
