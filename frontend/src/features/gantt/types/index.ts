import type { TaskPriority } from '@/features/tasks/types';
import type { TaskAssignee } from '@/features/tasks/types';

export interface GanttTask {
  id: string;
  slug: string;
  title: string;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  boardId: string;
  boardName: string;
  boardSlug: string;
  columnId: string;
  columnName: string;
  columnColor: string | null;
  assignees: TaskAssignee[];
}

export interface ProjectGanttData {
  scheduled: GanttTask[];
  unscheduled: GanttTask[];
}

export type GanttZoom = 'day' | 'week' | 'month';

export interface GanttTimelineRange {
  start: Date;
  end: Date;
}

export interface GanttBarLayout {
  leftPercent: number;
  widthPercent: number;
}
