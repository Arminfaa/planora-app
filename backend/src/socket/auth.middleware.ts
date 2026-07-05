import type { Socket } from 'socket.io';
import { ACCESS_TOKEN_COOKIE } from '../constants/auth';
import { verifyToken } from '../utils/jwt';
import type { JwtPayload } from '../types';

export interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user: JwtPayload;
  };
}

function parseCookieHeader(header: string): Record<string, string> {
  return header.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(rest.join('='));
    }
    return cookies;
  }, {});
}

function extractAccessToken(socket: Socket): string | undefined {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = parseCookieHeader(cookieHeader);
  return cookies[ACCESS_TOKEN_COOKIE];
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  const token = extractAccessToken(socket);

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
