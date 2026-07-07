import { AsyncLocalStorage } from 'node:async_hooks';
import type { Locale } from './types';
import { DEFAULT_LOCALE } from './types';

interface LocaleStore {
  locale: Locale;
}

export const localeStorage = new AsyncLocalStorage<LocaleStore>();

export function getRequestLocale(): Locale {
  return localeStorage.getStore()?.locale ?? DEFAULT_LOCALE;
}

export function runWithLocale<T>(locale: Locale, fn: () => T): T {
  return localeStorage.run({ locale }, fn);
}
