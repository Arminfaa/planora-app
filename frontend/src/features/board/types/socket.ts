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

export interface BoardSocketEvent {
  boardId: string;
  type: BoardEventType;
  userId: string;
  payload: unknown;
}
