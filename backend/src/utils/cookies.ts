import type { Response } from 'express';
import { env } from '../config';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_PATH,
  LEGACY_REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_PATH,
} from '../constants/auth';
import { parseDurationToMs } from './duration';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

function clearLegacyRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
  });
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  clearLegacyRefreshCookie(res);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    path: ACCESS_TOKEN_COOKIE_PATH,
    maxAge: parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: ACCESS_TOKEN_COOKIE_PATH,
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: REFRESH_TOKEN_COOKIE_PATH,
  });
  clearLegacyRefreshCookie(res);
}
