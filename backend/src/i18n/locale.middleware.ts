import type { NextFunction, Request, Response } from 'express';
import { localeStorage } from './context';
import { normalizeLocale, type Locale } from './types';

function resolveLocale(req: Request): Locale {
  const headerLocale = req.header('x-locale') ?? req.header('accept-language');
  return normalizeLocale(headerLocale ?? undefined);
}

export function localeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const locale = resolveLocale(req);

  localeStorage.run({ locale }, () => {
    next();
  });
}

export function getLocaleFromRequest(req: Request): Locale {
  return normalizeLocale(
    req.header('x-locale') ?? req.header('accept-language') ?? undefined,
  );
}
