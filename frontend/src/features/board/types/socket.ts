export type BoardEventType =
  'task:created' | 'task:updated' | 'task:deleted' | 'task:moved';

export interface BoardSocketEvent {
  boardId: string;
  type: BoardEventType;
  userId: string;
  payload: unknown;
}
