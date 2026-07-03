import type { Server as SocketServer } from 'socket.io';
import { projectAccessService } from '../services/project-access.service';
import { logger } from '../utils/logger';
import type { AuthenticatedSocket } from './auth.middleware';
import type { ProjectJoinPayload } from './types';
import { getProjectRoom } from './types';

type JoinAck = (response: { success: boolean; message?: string }) => void;

export function registerProjectHandlers(io: SocketServer): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.userId;

    socket.on(
      'project:join',
      async (payload: ProjectJoinPayload, callback?: JoinAck) => {
        const { projectId } = payload;
        if (!projectId) {
          callback?.({ success: false, message: 'Project ID is required' });
          return;
        }

        try {
          await projectAccessService.ensureMember(userId, projectId);
        } catch {
          callback?.({ success: false, message: 'Access denied' });
          return;
        }

        await socket.join(getProjectRoom(projectId));
        logger.info(`User ${userId} joined project room ${projectId}`);
        callback?.({ success: true });
      },
    );

    socket.on('project:leave', async (payload: ProjectJoinPayload) => {
      const { projectId } = payload;
      if (!projectId) return;

      await socket.leave(getProjectRoom(projectId));
      logger.debug(`User ${userId} left project room ${projectId}`);
    });
  });
}
