export type BoardEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:moved'
  | 'column:created'
  | 'column:updated'
  | 'column:deleted'
  | 'columns:reordered'
  | 'board:updated'
  | 'board:deleted';

export type ProjectEventType =
  | 'board:created'
  | 'board:updated'
  | 'board:deleted'
  | 'group:message:created'
  | 'group:message:updated'
  | 'group:message:deleted'
  | 'task:dependency:created'
  | 'task:dependency:deleted';

export interface BoardSocketEvent {
  boardId: string;
  type: BoardEventType;
  userId: string;
  payload: unknown;
}

export interface ProjectSocketEvent {
  projectId: string;
  type: ProjectEventType;
  userId: string;
  payload: unknown;
}

export interface BoardJoinPayload {
  boardId: string;
}

export interface ProjectJoinPayload {
  projectId: string;
}

export function getBoardRoom(boardId: string): string {
  return `board:${boardId}`;
}

export function getProjectRoom(projectId: string): string {
  return `project:${projectId}`;
}

export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}
