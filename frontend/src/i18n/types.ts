export type Locale = 'en' | 'fa';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'app-locale';

export const LOCALES: readonly Locale[] = ['en', 'fa'] as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fa';
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

export function getIntlLocale(locale: Locale): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}
