import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getIntlLocale,
  isLocale,
  type Locale,
} from './types';
import { VAZIRMATN_PRELOAD_WEIGHTS } from '@/lib/fonts';
import { formatLocaleDate } from '@/lib/jalali-dates';
import type { Messages } from './messages/en';

type MessageNode = string | { [key: string]: MessageNode };

export function getNestedMessage(
  obj: MessageNode,
  path: string,
): string | undefined {
  const parts = path.split('.');
  let current: MessageNode = obj;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in vars) {
      return String(vars[key]);
    }
    return match;
  });
}

export type Translator = (
  path: string,
  vars?: Record<string, string | number>,
) => string;

export function createTranslator(
  locale: Locale,
  messages: Messages,
): Translator {
  return (path, vars) => {
    const raw = getNestedMessage(messages, path);
    if (raw === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation for "${path}" (${locale})`);
      }
      return path;
    }

    return vars ? interpolate(raw, vars) : raw;
  };
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleDate(value, locale, options);
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${LOCALE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`,
    ),
  );

  if (!match) {
    return null;
  }

  const value = decodeURIComponent(match[1]);
  return isLocale(value) ? value : null;
}

export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function resolveInitialLocale(): Locale {
  return readLocaleCookie() ?? DEFAULT_LOCALE;
}

function preloadVazirmatnFonts(): void {
  if (typeof document === 'undefined') {
    return;
  }

  for (const weight of VAZIRMATN_PRELOAD_WEIGHTS) {
    const href = `/vazir/Vazirmatn-${weight}.woff2`;

    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) {
      continue;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  }
}

export function applyDocumentLocale(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('locale-fa', locale === 'fa');
  document.documentElement.classList.toggle('locale-en', locale === 'en');

  if (locale === 'fa') {
    preloadVazirmatnFonts();
  }
}
