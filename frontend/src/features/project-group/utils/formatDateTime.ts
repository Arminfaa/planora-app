import type { Locale } from '@/i18n/types';
import { formatLocaleDate } from '@/lib/jalali-dates';

export function formatMessageDateTime(
  value: string,
  locale: Locale = 'en',
): string {
  return formatLocaleDate(value, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMessageTime(
  value: string,
  locale: Locale = 'en',
): string {
  return formatLocaleDate(value, locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateSeparator(
  value: string,
  locale: Locale = 'en',
): string {
  return formatLocaleDate(value, locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getMessageDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
