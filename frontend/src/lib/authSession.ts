import type { AxiosInstance } from 'axios';

/** Refresh access token ~1 min before the default 15m access TTL. */
const SESSION_REFRESH_INTERVAL_MS = 14 * 60 * 1000;

const PUBLIC_PATH_PREFIXES = ['/', '/login', '/register', '/accept-invite'];

let apiRef: AxiosInstance | null = null;
let refreshPromise: Promise<void> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

export function bindAuthApi(instance: AxiosInstance): void {
  apiRef = instance;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => prefix !== '/' && pathname.startsWith(prefix),
  );
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (isPublicPath(pathname)) return;

  const redirect = encodeURIComponent(`${pathname}${window.location.search}`);
  window.location.href = `/login?redirect=${redirect}`;
}

export async function refreshSession(): Promise<void> {
  if (!apiRef) {
    throw new Error('Auth API is not initialized');
  }

  if (!refreshPromise) {
    refreshPromise = apiRef
      .post('/auth/refresh')
      .then(() => undefined)
      .catch((error) => {
        refreshPromise = null;
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function startSessionRefresh(): void {
  if (typeof window === 'undefined') return;

  stopSessionRefresh();
  refreshTimer = setInterval(() => {
    void refreshSession().catch(() => undefined);
  }, SESSION_REFRESH_INTERVAL_MS);
}

export function stopSessionRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
