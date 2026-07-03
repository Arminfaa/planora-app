import type { TaskPriority } from '@/features/tasks/types';
import type { TaskLabel } from '@/features/labels/types';

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
  slug: string;
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
  labels?: Array<{ label: TaskLabel }> | TaskLabel[];
  _count?: {
    attachments: number;
  };
}

export interface Board {
  id: string;
  name: string;
  slug: string;
  projectId: string;
  position: number;
  backgroundUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  columns?: BoardColumn[];
  _count?: { columns: number };
}

export interface CreateBoardInput {
  name: string;
  position?: number;
}

export interface UpdateBoardInput {
  name?: string;
  position?: number;
}

export interface CreateColumnInput {
  name: string;
  position?: number;
  color?: string;
}

export interface UpdateColumnInput {
  name?: string;
  position?: number;
  color?: string;
}

export const COLUMN_COLOR_OPTIONS = [
  '#6B7280',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
] as const;
