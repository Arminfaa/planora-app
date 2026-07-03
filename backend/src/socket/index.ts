import type { Server as SocketServer } from 'socket.io';
import { socketAuthMiddleware } from './auth.middleware';
import { registerBoardHandlers } from './board.handler';
import { setSocketServer } from './io';

export function setupSocket(server: SocketServer): void {
  setSocketServer(server);
  server.use(socketAuthMiddleware);
  registerBoardHandlers(server);
}

export { emitBoardEvent } from './board.events';
export type { BoardSocketEvent, BoardEventType } from './types';
