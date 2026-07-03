import type { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import type { JwtPayload } from '../types';

export interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user: JwtPayload;
  };
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const user = verifyToken(token);
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
