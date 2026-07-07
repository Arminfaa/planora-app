import type { Locale } from '@/i18n/types';
import { formatLocaleDate } from '@/lib/jalali-dates';

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function formatDueDate(value: string, locale: Locale = 'en'): string {
  return formatLocaleDate(value, locale, {
    month: 'short',
    day: 'numeric',
  });
}

export function isDueDateOverdue(value: string): boolean {
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}
