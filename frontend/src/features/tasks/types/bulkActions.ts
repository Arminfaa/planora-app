import type { TaskPriority } from './index';

export type BulkOperationMode =
  | 'move'
  | 'dueDate'
  | 'startDate'
  | 'completeDate'
  | 'assignees'
  | 'priority'
  | 'completed'
  | 'progress'
  | 'addLabels'
  | 'removeLabels'
  | 'setLabels'
  | 'checklist'
  | 'export';

export type BulkTaskAction =
  | { type: 'move'; columnId: string }
  | { type: 'setDueDate'; dueDate: string | null }
  | { type: 'setStartDate'; startDate: string | null }
  | { type: 'setCompleteDate'; completeDate: string | null }
  | { type: 'setAssignees'; assigneeIds: string[] }
  | { type: 'setPriority'; priority: TaskPriority }
  | { type: 'setCompleted'; isCompleted: boolean }
  | { type: 'setProgress'; progress: number }
  | { type: 'addLabels'; labelIds: string[] }
  | { type: 'removeLabels'; labelIds: string[] }
  | { type: 'setLabels'; labelIds: string[] }
  | { type: 'addChecklistItem'; title: string; weight?: number };

export interface BulkTaskActionRequest {
  taskIds: string[];
  action: BulkTaskAction;
}
