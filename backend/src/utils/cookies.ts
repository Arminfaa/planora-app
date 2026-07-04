import type { Response } from 'express';
import { env } from '../config';
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE,
} from '../constants/auth';
import { parseDurationToMs } from './duration';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    path: '/',
    maxAge: parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    path: AUTH_COOKIE_PATH,
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/',
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: AUTH_COOKIE_PATH,
  });
}
