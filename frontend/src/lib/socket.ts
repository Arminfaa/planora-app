import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { refreshSession } from '@/lib/authSession';
import type { BoardSocketEvent } from '@/features/board/types/socket';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';
import type { ApiSuccessResponse } from '@/shared/types/api';

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  return apiUrl.replace(/\/api\/v\d+$/, '');
}

type BoardEventListener = (event: BoardSocketEvent) => void;
type ProjectEventListener = (event: ProjectSocketEvent) => void;

let socket: Socket | null = null;
let globalHandlerAttached = false;
let connectPromise: Promise<void> | null = null;

const boardSubscriptions = new Map<string, Set<BoardEventListener>>();
const projectSubscriptions = new Map<string, Set<ProjectEventListener>>();
const joinedBoards = new Set<string>();
const joinedProjects = new Set<string>();

async function fetchSocketToken(): Promise<string | null> {
  try {
    const { data } =
      await api.get<ApiSuccessResponse<{ token: string }>>(
        '/auth/socket-token',
      );
    return data.data.token;
  } catch {
    return null;
  }
}

async function applySocketAuth(sock: Socket): Promise<boolean> {
  const token = await fetchSocketToken();
  if (!token) {
    return false;
  }

  sock.auth = { token };
  return true;
}

function dispatchBoardEvent(event: BoardSocketEvent): void {
  const listeners = boardSubscriptions.get(event.boardId);
  if (!listeners) return;

  listeners.forEach((listener) => listener(event));
}

function dispatchProjectEvent(event: ProjectSocketEvent): void {
  const listeners = projectSubscriptions.get(event.projectId);
  if (!listeners) return;

  listeners.forEach((listener) => listener(event));
}

function attachGlobalHandlers(sock: Socket): void {
  if (globalHandlerAttached) return;
  globalHandlerAttached = true;

  sock.on('board:event', dispatchBoardEvent);
  sock.on('project:event', dispatchProjectEvent);

  sock.on('connect', () => {
    joinedBoards.clear();
    joinedProjects.clear();
    for (const boardId of boardSubscriptions.keys()) {
      void joinBoardRoom(sock, boardId);
    }
    for (const projectId of projectSubscriptions.keys()) {
      void joinProjectRoom(sock, projectId);
    }
  });

  sock.on('connect_error', (error) => {
    const message = error.message.toLowerCase();
    if (!message.includes('auth')) {
      return;
    }

    void refreshSession()
      .then(() => applySocketAuth(sock))
      .then((ready) => {
        if (!ready) return;
        sock.disconnect();
        sock.connect();
      })
      .catch(() => undefined);
  });

  sock.io.on('reconnect_attempt', () => {
    void fetchSocketToken().then((token) => {
      if (token) {
        sock.auth = { token };
      }
    });
  });
}

function createSocketInstance(): Socket {
  return io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });
}

async function ensureSocketConnecting(sock: Socket): Promise<void> {
  if (sock.connected || sock.active) {
    return;
  }

  if (connectPromise) {
    await connectPromise;
    return;
  }

  connectPromise = (async () => {
    const ready = await applySocketAuth(sock);
    if (ready && !sock.connected) {
      sock.connect();
    }
  })().finally(() => {
    connectPromise = null;
  });

  await connectPromise;
}

export function connectSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    socket = createSocketInstance();
    attachGlobalHandlers(socket);
  } else {
    attachGlobalHandlers(socket);
  }

  void ensureSocketConnecting(socket);
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  globalHandlerAttached = false;
  connectPromise = null;
  joinedBoards.clear();
  joinedProjects.clear();
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

export function joinProjectRoom(
  sock: Socket,
  projectId: string,
): Promise<boolean> {
  if (joinedProjects.has(projectId) && sock.connected) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (value) {
        joinedProjects.add(projectId);
      }
      resolve(value);
    };

    const timer = setTimeout(() => finish(false), 5000);

    sock.emit(
      'project:join',
      { projectId },
      (response?: { success?: boolean }) => {
        finish(response?.success === true);
      },
    );
  });
}

export function leaveProjectRoom(sock: Socket, projectId: string): void {
  joinedProjects.delete(projectId);
  sock.emit('project:leave', { projectId });
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

  void ensureSocketConnecting(sock)
    .then(() => joinBoardRoom(sock, boardId))
    .then((joined) => {
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

export function subscribeToProject(
  projectId: string,
  listener: ProjectEventListener,
  onJoined?: (joined: boolean) => void,
): () => void {
  const sock = connectSocket();
  if (!sock) {
    onJoined?.(false);
    return () => {};
  }

  let listeners = projectSubscriptions.get(projectId);
  if (!listeners) {
    listeners = new Set();
    projectSubscriptions.set(projectId, listeners);
  }

  listeners.add(listener);

  void ensureSocketConnecting(sock)
    .then(() => joinProjectRoom(sock, projectId))
    .then((joined) => {
      onJoined?.(joined);
    });

  return () => {
    const current = projectSubscriptions.get(projectId);
    current?.delete(listener);

    if (current?.size === 0) {
      projectSubscriptions.delete(projectId);
      leaveProjectRoom(sock, projectId);
    }
  };
}
