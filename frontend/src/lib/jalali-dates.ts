import dayjs, { type Dayjs } from 'dayjs';
import jalaliday from 'jalaliday/dayjs';
import type { Locale } from '@/i18n/types';
import { getIntlLocale } from '@/i18n/types';

dayjs.extend(jalaliday);

export const GREGORIAN_API_DATE_FORMAT = 'YYYY-MM-DD';
export const JALALI_DISPLAY_DATE_FORMAT = 'YYYY/MM/DD';

export function apiDateToPickerValue(
  value: string | null | undefined,
  locale: Locale,
): Dayjs | null {
  if (!value?.trim()) return null;

  const gregorian = dayjs(value.slice(0, 10), GREGORIAN_API_DATE_FORMAT).calendar(
    'gregory',
  );

  if (!gregorian.isValid()) return null;

  return locale === 'fa' ? gregorian.calendar('jalali') : gregorian;
}

export function pickerValueToApiDate(
  date: Dayjs | null | undefined,
): string {
  if (!date?.isValid()) return '';
  return date.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT);
}

export function getDateInputFormat(locale: Locale): string {
  return locale === 'fa'
    ? JALALI_DISPLAY_DATE_FORMAT
    : GREGORIAN_API_DATE_FORMAT;
}

export function formatLocaleDate(
  value: string | Date | number | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (value == null || value === '') return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...options,
  };

  if (locale === 'fa') {
    formatOptions.calendar = 'persian';
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), formatOptions).format(
    date,
  );
}
