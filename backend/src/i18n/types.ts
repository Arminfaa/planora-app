export const SUPPORTED_LOCALES = ['en', 'fa'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase().split(',')[0]?.trim().split('-')[0];
  return normalized === 'fa' ? 'fa' : 'en';
}
