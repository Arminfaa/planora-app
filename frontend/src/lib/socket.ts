import { io, type Socket } from 'socket.io-client';
import { getToken } from '@/features/auth/utils/token';
import type { BoardSocketEvent } from '@/features/board/types/socket';

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  return apiUrl.replace(/\/api\/v\d+$/, '');
}

type BoardEventListener = (event: BoardSocketEvent) => void;

let socket: Socket | null = null;
let activeToken: string | null = null;
let globalHandlerAttached = false;

const boardSubscriptions = new Map<string, Set<BoardEventListener>>();
const joinedBoards = new Set<string>();

function dispatchBoardEvent(event: BoardSocketEvent): void {
  const listeners = boardSubscriptions.get(event.boardId);
  if (!listeners) return;

  listeners.forEach((listener) => listener(event));
}

function attachGlobalHandlers(sock: Socket): void {
  if (globalHandlerAttached) return;
  globalHandlerAttached = true;

  sock.on('board:event', dispatchBoardEvent);

  sock.on('connect', () => {
    joinedBoards.clear();
    for (const boardId of boardSubscriptions.keys()) {
      void joinBoardRoom(sock, boardId);
    }
  });
}

export function connectSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  if (socket && activeToken !== token) {
    disconnectSocket();
  }

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    attachGlobalHandlers(socket);
    return socket;
  }

  activeToken = token;
  socket = io(getSocketUrl(), {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  attachGlobalHandlers(socket);
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  activeToken = null;
  globalHandlerAttached = false;
  joinedBoards.clear();
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export function joinBoardRoom(sock: Socket, boardId: string): Promise<boolean> {
  if (joinedBoards.has(boardId) && sock.connected) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (value) {
        joinedBoards.add(boardId);
      }
      resolve(value);
    };

    const timer = setTimeout(() => finish(false), 5000);

    sock.emit('board:join', { boardId }, (response?: { success?: boolean }) => {
      finish(response?.success === true);
    });
  });
}

export function leaveBoardRoom(sock: Socket, boardId: string): void {
  joinedBoards.delete(boardId);
  sock.emit('board:leave', { boardId });
}

export function subscribeToBoard(
  boardId: string,
  listener: BoardEventListener,
  onJoined?: (joined: boolean) => void,
): () => void {
  const sock = connectSocket();
  if (!sock) {
    onJoined?.(false);
    return () => {};
  }

  let listeners = boardSubscriptions.get(boardId);
  if (!listeners) {
    listeners = new Set();
    boardSubscriptions.set(boardId, listeners);
  }

  listeners.add(listener);

  void joinBoardRoom(sock, boardId).then((joined) => {
    onJoined?.(joined);
  });

  return () => {
    const current = boardSubscriptions.get(boardId);
    current?.delete(listener);

    if (current?.size === 0) {
      boardSubscriptions.delete(boardId);
      leaveBoardRoom(sock, boardId);
    }
  };
}
