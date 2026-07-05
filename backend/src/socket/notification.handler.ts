import type { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';
import type { AuthenticatedSocket } from './auth.middleware';
import { getUserRoom } from './types';

export function registerNotificationHandlers(io: SocketServer): void {
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.userId;
    const room = getUserRoom(userId);

    await socket.join(room);
    logger.debug(`User ${userId} joined notification room`);
  });
}
