import type { Server as SocketServer } from 'socket.io';
import { socketAuthMiddleware } from './auth.middleware';
import { registerBoardHandlers } from './board.handler';
import { registerProjectHandlers } from './project.handler';
import { registerNotificationHandlers } from './notification.handler';
import { setSocketServer } from './io';

export function setupSocket(server: SocketServer): void {
  setSocketServer(server);
  server.use(socketAuthMiddleware);
  registerBoardHandlers(server);
  registerProjectHandlers(server);
  registerNotificationHandlers(server);
}

export { emitBoardEvent } from './board.events';
export { emitProjectEvent } from './project.events';
export type {
  BoardSocketEvent,
  BoardEventType,
  ProjectSocketEvent,
  ProjectEventType,
} from './types';
