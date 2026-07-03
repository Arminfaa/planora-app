export type ProjectEventType =
  'board:created' | 'board:updated' | 'board:deleted';

export interface ProjectSocketEvent {
  projectId: string;
  type: ProjectEventType;
  userId: string;
  payload: unknown;
}
