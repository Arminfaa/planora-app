import dayjs, { type Dayjs } from 'dayjs';
import jalaliday from 'jalaliday/dayjs';
import type { Locale } from '@/i18n/types';
import { getIntlLocale } from '@/i18n/types';

dayjs.extend(jalaliday);

export const GREGORIAN_API_DATE_FORMAT = 'YYYY-MM-DD';
export const JALALI_DISPLAY_DATE_FORMAT = 'YYYY/MM/DD';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function isLikelyJalaliYear(year: number): boolean {
  return year >= 1200 && year < 1700;
}

export function normalizeDateDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (ch) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(ch);
    if (persianIndex >= 0) return String(persianIndex);

    const arabicIndex = ARABIC_DIGITS.indexOf(ch);
    if (arabicIndex >= 0) return String(arabicIndex);

    return ch;
  });
}

/** Always format as Gregorian YYYY-MM-DD for API storage, regardless of UI calendar. */
export function toApiDate(date: Dayjs | Date | null | undefined): string {
  if (!date) return '';
  const value = dayjs.isDayjs(date) ? date : dayjs(date);
  if (!value.isValid()) return '';
  return value.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT);
}

export function todayApiDate(): string {
  return toApiDate(dayjs());
}

export function shiftApiDate(apiDate: string, days: number): string {
  const value = apiDateToPickerValue(apiDate, 'en');
  if (!value) return '';
  return toApiDate(value.add(days, 'day'));
}

export function defaultApiDateRange(daysBack = 29): {
  from: string;
  to: string;
} {
  const to = todayApiDate();
  const from = shiftApiDate(to, -daysBack);
  return { from, to };
}

function parseApiDateParts(
  value: string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    normalizeDateDigits(value.trim()).slice(0, 10),
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function jalaliPartsToApiDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const jalali = dayjs(normalized, { jalali: true });

  if (!jalali.isValid()) return null;

  return toApiDate(jalali);
}

function gregorianPartsToApiDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  return toApiDate(probe);
}

/** Parse Excel/import date strings (Jalali or Gregorian) to API format. */
export function parseImportDateToApiDate(value: string): string | null {
  const trimmed = normalizeDateDigits(value.trim());
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);

    if (isLikelyJalaliYear(year)) {
      const jalali = jalaliPartsToApiDate(year, month, day);
      if (jalali) return jalali;
    }

    const gregorian = gregorianPartsToApiDate(year, month, day);
    if (gregorian) return gregorian;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);

    if (isLikelyJalaliYear(year)) {
      const jalali = jalaliPartsToApiDate(year, month, day);
      if (jalali) return jalali;
    }

    const gregorian = gregorianPartsToApiDate(year, month, day);
    if (gregorian) return gregorian;
  }

  const serial = Number(trimmed);
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    const excelEpoch = dayjs(new Date(1899, 11, 30));
    const fromSerial = excelEpoch.add(serial, 'day');
    if (fromSerial.isValid()) {
      return toApiDate(fromSerial);
    }
  }

  const native = dayjs(trimmed);
  if (native.isValid() && !/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(trimmed)) {
    return toApiDate(native);
  }

  return null;
}

/** Parse Excel/import date-time strings (Jalali or Gregorian) to ISO format. */
export function parseImportDateTimeToIso(value: string): string | null {
  const trimmed = normalizeDateDigits(value.trim());
  if (!trimmed) return null;

  const timeMatch = trimmed.match(/\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (timeMatch) {
    const datePart = trimmed
      .slice(0, trimmed.length - timeMatch[0].length)
      .trim();
    const apiDate = parseImportDateToApiDate(datePart);
    if (!apiDate) return null;

    const parts = parseApiDateParts(apiDate);
    if (!parts) return null;

    const timeBits = timeMatch[1].split(':').map(Number);
    const hours = timeBits[0] ?? 0;
    const minutes = timeBits[1] ?? 0;
    const seconds = timeBits[2] ?? 0;
    return new Date(
      parts.year,
      parts.month - 1,
      parts.day,
      hours,
      minutes,
      seconds,
    ).toISOString();
  }

  if (/T|\d{1,2}:\d{2}/.test(trimmed)) {
    const parsed = dayjs(trimmed);
    if (parsed.isValid()) return parsed.toISOString();
  }

  const dateOnly = parseImportDateToApiDate(trimmed);
  if (dateOnly) {
    const parts = parseApiDateParts(dateOnly);
    if (!parts) return null;
    return new Date(parts.year, parts.month - 1, parts.day).toISOString();
  }

  return null;
}

/**
 * Convert API Gregorian YYYY-MM-DD into a Dayjs value for Ant DatePicker.
 * UI calendar follows locale: FA → jalali, EN → gregory.
 */
export function apiDateToPickerValue(
  value: string | null | undefined,
  locale: Locale,
): Dayjs | null {
  const parts = parseApiDateParts(value);
  if (!parts) return null;

  // Construct from local Date parts so we never re-parse YYYY-MM-DD under Jalali mode.
  const base = dayjs(new Date(parts.year, parts.month - 1, parts.day));
  if (!base.isValid()) return null;

  return locale === 'fa' ? base.calendar('jalali') : base.calendar('gregory');
}

export function pickerValueToApiDate(date: Dayjs | null | undefined): string {
  return toApiDate(date ?? null);
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

  // API dates are calendar days; prefer local-noon construction to avoid TZ day-shift.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    const parts = parseApiDateParts(value);
    if (parts) {
      value = new Date(parts.year, parts.month - 1, parts.day, 12);
    }
  }

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
