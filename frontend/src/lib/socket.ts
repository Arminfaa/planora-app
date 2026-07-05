import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { refreshSession } from '@/lib/authSession';
import type { BoardSocketEvent } from '@/features/board/types/socket';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  if (apiUrl.startsWith('/')) {
    return 'http://localhost:3000';
  }

  return apiUrl.replace(/\/api\/v\d+$/, '');
}

function isCrossOriginSocket(url: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return false;
  }
}

type BoardEventListener = (event: BoardSocketEvent) => void;
type ProjectEventListener = (event: ProjectSocketEvent) => void;
type JoinCallback = (joined: boolean) => void;

let socket: Socket | null = null;
let globalHandlerAttached = false;
let connectPromise: Promise<void> | null = null;
let cachedAuthToken: string | undefined;
let authTokenPromise: Promise<string | undefined> | null = null;
let visibilityHandlerAttached = false;

const boardSubscriptions = new Map<string, Set<BoardEventListener>>();
const projectSubscriptions = new Map<string, Set<ProjectEventListener>>();
const boardJoinCallbacks = new Map<string, Set<JoinCallback>>();
const projectJoinCallbacks = new Map<string, Set<JoinCallback>>();
const joinedBoards = new Set<string>();
const joinedProjects = new Set<string>();

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

function notifyBoardJoined(boardId: string, joined: boolean): void {
  boardJoinCallbacks.get(boardId)?.forEach((callback) => callback(joined));
}

function notifyProjectJoined(projectId: string, joined: boolean): void {
  projectJoinCallbacks.get(projectId)?.forEach((callback) => callback(joined));
}

function trackJoinCallback(
  map: Map<string, Set<JoinCallback>>,
  roomId: string,
  callback?: JoinCallback,
): void {
  if (!callback) return;

  let callbacks = map.get(roomId);
  if (!callbacks) {
    callbacks = new Set();
    map.set(roomId, callbacks);
  }

  callbacks.add(callback);
}

function untrackJoinCallback(
  map: Map<string, Set<JoinCallback>>,
  roomId: string,
  callback?: JoinCallback,
): void {
  if (!callback) return;

  const callbacks = map.get(roomId);
  callbacks?.delete(callback);

  if (callbacks?.size === 0) {
    map.delete(roomId);
  }
}

function clearCachedAuthToken(): void {
  cachedAuthToken = undefined;
  authTokenPromise = null;
}

async function resolveSocketAuth(): Promise<{ token?: string } | undefined> {
  const url = getSocketUrl();
  if (!isCrossOriginSocket(url)) {
    return undefined;
  }

  if (cachedAuthToken) {
    return { token: cachedAuthToken };
  }

  if (!authTokenPromise) {
    authTokenPromise = api
      .get<{ data: { token: string } }>('/auth/socket-token')
      .then((response) => response.data.data.token)
      .catch(() => undefined)
      .finally(() => {
        authTokenPromise = null;
      });
  }

  const token = await authTokenPromise;
  if (!token) {
    return undefined;
  }

  cachedAuthToken = token;
  return { token };
}

function waitForConnect(sock: Socket, timeoutMs = 20_000): Promise<void> {
  if (sock.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      cleanup();
      resolve();
    };

    const onConnect = () => finish();

    const timer = setTimeout(() => finish(), timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      sock.off('connect', onConnect);
    };

    sock.on('connect', onConnect);

    if (!sock.active) {
      sock.connect();
    }
  });
}

function attachVisibilityHandler(sock: Socket): void {
  if (visibilityHandlerAttached || typeof document === 'undefined') {
    return;
  }

  visibilityHandlerAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || sock.connected) {
      return;
    }

    void ensureSocketConnecting(sock);
  });
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
      void joinBoardRoom(sock, boardId).then((joined) => {
        notifyBoardJoined(boardId, joined);
      });
    }

    for (const projectId of projectSubscriptions.keys()) {
      void joinProjectRoom(sock, projectId).then((joined) => {
        notifyProjectJoined(projectId, joined);
      });
    }
  });

  sock.on('connect_error', (error) => {
    const message = error.message.toLowerCase();
    if (!message.includes('auth')) {
      return;
    }

    clearCachedAuthToken();

    void refreshSession()
      .then(async () => {
        const auth = await resolveSocketAuth();
        if (auth?.token) {
          sock.auth = auth;
        }

        sock.disconnect();
        sock.connect();
      })
      .catch(() => undefined);
  });

  attachVisibilityHandler(sock);
}

function createSocketInstance(): Socket {
  return io(getSocketUrl(), {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    transports: ['polling', 'websocket'],
  });
}

async function ensureSocketConnecting(sock: Socket): Promise<void> {
  if (sock.connected) {
    return;
  }

  if (connectPromise) {
    await connectPromise;
    return;
  }

  connectPromise = (async () => {
    const auth = await resolveSocketAuth();
    if (auth?.token) {
      sock.auth = auth;
    }

    await waitForConnect(sock);
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
  visibilityHandlerAttached = false;
  connectPromise = null;
  clearCachedAuthToken();
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
  onJoined?: JoinCallback,
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
  trackJoinCallback(boardJoinCallbacks, boardId, onJoined);

  void ensureSocketConnecting(sock)
    .then(() => joinBoardRoom(sock, boardId))
    .then((joined) => {
      onJoined?.(joined);
    });

  return () => {
    const current = boardSubscriptions.get(boardId);
    current?.delete(listener);

    untrackJoinCallback(boardJoinCallbacks, boardId, onJoined);

    if (current?.size === 0) {
      boardSubscriptions.delete(boardId);
      boardJoinCallbacks.delete(boardId);
      leaveBoardRoom(sock, boardId);
    }
  };
}

export function subscribeToProject(
  projectId: string,
  listener: ProjectEventListener,
  onJoined?: JoinCallback,
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
  trackJoinCallback(projectJoinCallbacks, projectId, onJoined);

  void ensureSocketConnecting(sock)
    .then(() => joinProjectRoom(sock, projectId))
    .then((joined) => {
      onJoined?.(joined);
    });

  return () => {
    const current = projectSubscriptions.get(projectId);
    current?.delete(listener);

    untrackJoinCallback(projectJoinCallbacks, projectId, onJoined);

    if (current?.size === 0) {
      projectSubscriptions.delete(projectId);
      projectJoinCallbacks.delete(projectId);
      leaveProjectRoom(sock, projectId);
    }
  };
}
