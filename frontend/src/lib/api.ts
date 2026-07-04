import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/shared/types/api';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.method?.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
  }

  return config;
});

let refreshPromise: Promise<void> | null = null;

const PUBLIC_PATH_PREFIXES = ['/', '/login', '/register', '/accept-invite'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => prefix !== '/' && pathname.startsWith(prefix),
  );
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  if (isPublicPath(pathname)) return;

  window.location.href = '/login';
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
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

function isAuthRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';

    if (isAuthRoute(requestUrl)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
      return api(originalRequest);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);

export const getApiStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

export const isForbiddenError = (error: unknown): boolean =>
  getApiStatus(error) === 403;

export const isNotFoundError = (error: unknown): boolean =>
  getApiStatus(error) === 404;

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(', ');
    }
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action';
    }
  }

  if (error instanceof Error && !error.message.includes('status code')) {
    return error.message;
  }

  return 'Something went wrong';
};
