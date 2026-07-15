import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/shared/types/api';
import { getMessages } from '@/i18n/messages';
import { LOCALE_COOKIE, type Locale } from '@/i18n/types';
import { createTranslator } from '@/i18n/utils';
import {
  bindAuthApi,
  redirectToLogin,
  refreshSession,
} from '@/lib/authSession';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

function readClientLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  return match?.[1] === 'fa' ? 'fa' : 'en';
}

function getClientTranslator() {
  const locale = readClientLocale();
  return createTranslator(locale, getMessages(locale));
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

bindAuthApi(api);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    config.headers['X-Locale'] = readClientLocale();
  }

  if (config.method?.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
  }

  return config;
});

function isAuthRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
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
  const t = getClientTranslator();

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(', ');
    }
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 403) {
      return t('common.noPermission');
    }
  }

  if (error instanceof Error && !error.message.includes('status code')) {
    return error.message;
  }

  return t('common.somethingWentWrong');
};
