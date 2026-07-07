export type ProjectEventType =
  | 'board:created'
  | 'board:updated'
  | 'board:deleted'
  | 'group:message:created'
  | 'group:message:updated'
  | 'group:message:deleted'
  | 'task:dependency:created'
  | 'task:dependency:deleted';

export interface ProjectSocketEvent {
  projectId: string;
  type: ProjectEventType;
  userId: string;
  payload: unknown;
}
