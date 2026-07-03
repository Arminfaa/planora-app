import { getSocketServer } from './io';
import type { BoardSocketEvent } from './types';
import { getBoardRoom } from './types';
import { logger } from '../utils/logger';

export function emitBoardEvent(event: BoardSocketEvent): void {
  const room = getBoardRoom(event.boardId);
  const socketsInRoom = getSocketServer().sockets.adapter.rooms.get(room);

  logger.info(`Emitting ${event.type} to room ${room}`, {
    listeners: socketsInRoom?.size ?? 0,
    userId: event.userId,
  });

  getSocketServer().to(room).emit('board:event', event);
}
