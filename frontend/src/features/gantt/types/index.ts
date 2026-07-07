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

export type GanttDependencyType = 'FINISH_TO_START';

export interface GanttDependency {
  id: string;
  projectId: string;
  fromTaskId: string;
  toTaskId: string;
  type: GanttDependencyType;
  fromTaskTitle: string;
  toTaskTitle: string;
  fromBoardName: string;
  toBoardName: string;
  createdAt: string;
}

export interface ProjectGanttData {
  scheduled: GanttTask[];
  unscheduled: GanttTask[];
  dependencies: GanttDependency[];
}

export interface TaskDependencyLists {
  predecessors: GanttDependency[];
  successors: GanttDependency[];
}

export type GanttZoom = 'day' | 'week' | 'month';

export interface GanttTimelineRange {
  start: Date;
  end: Date;
}

export interface GanttBarLayout {
  leftPx: number;
  widthPx: number;
}

export interface GanttTaskRowLayout {
  taskId: string;
  top: number;
  centerY: number;
  barLeftPx: number;
  barWidthPx: number;
}
