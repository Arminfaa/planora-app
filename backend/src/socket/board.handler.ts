import type { Server as SocketServer } from 'socket.io';
import { boardRepository } from '../repositories/board.repository';
import { projectAccessService } from '../services/project-access.service';
import { logger } from '../utils/logger';
import type { AuthenticatedSocket } from './auth.middleware';
import type { BoardJoinPayload } from './types';
import { getBoardRoom } from './types';

type JoinAck = (response: { success: boolean; message?: string }) => void;

async function ensureBoardAccess(
  userId: string,
  boardId: string,
): Promise<boolean> {
  const projectId = await boardRepository.getProjectId(boardId);
  if (!projectId) return false;

  try {
    await projectAccessService.ensureMember(userId, projectId);
    return true;
  } catch {
    return false;
  }
}

export function registerBoardHandlers(io: SocketServer): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    socket.on(
      'board:join',
      async (payload: BoardJoinPayload, callback?: JoinAck) => {
        const { boardId } = payload;
        if (!boardId) {
          callback?.({ success: false, message: 'Board ID is required' });
          return;
        }

        const allowed = await ensureBoardAccess(userId, boardId);
        if (!allowed) {
          callback?.({ success: false, message: 'Access denied' });
          return;
        }

        await socket.join(getBoardRoom(boardId));
        logger.info(`User ${userId} joined board room ${boardId}`);
        callback?.({ success: true });
      },
    );

    socket.on('board:leave', async (payload: BoardJoinPayload) => {
      const { boardId } = payload;
      if (!boardId) return;

      await socket.leave(getBoardRoom(boardId));
      logger.debug(`User ${userId} left board room ${boardId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}
