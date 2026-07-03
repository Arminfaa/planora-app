import { getSocketServer } from './io';
import type { ProjectSocketEvent } from './types';
import { getProjectRoom } from './types';
import { logger } from '../utils/logger';

export function emitProjectEvent(event: ProjectSocketEvent): void {
  const room = getProjectRoom(event.projectId);
  const socketsInRoom = getSocketServer().sockets.adapter.rooms.get(room);

  logger.info(`Emitting ${event.type} to room ${room}`, {
    listeners: socketsInRoom?.size ?? 0,
    userId: event.userId,
  });

  getSocketServer().to(room).emit('project:event', event);
}
