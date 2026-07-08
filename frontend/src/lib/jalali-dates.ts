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

function jalaliPartsToApiDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const jalali = dayjs(normalized, { jalali: true });

  if (!jalali.isValid()) return null;

  return jalali.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT);
}

function gregorianPartsToApiDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const gregorian = dayjs(normalized, GREGORIAN_API_DATE_FORMAT, true);

  if (!gregorian.isValid()) return null;

  return gregorian.format(GREGORIAN_API_DATE_FORMAT);
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
    const excelEpoch = dayjs('1899-12-30', GREGORIAN_API_DATE_FORMAT);
    const fromSerial = excelEpoch.add(serial, 'day');
    if (fromSerial.isValid()) {
      return fromSerial.format(GREGORIAN_API_DATE_FORMAT);
    }
  }

  const native = dayjs(trimmed);
  if (native.isValid() && !/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(trimmed)) {
    return native.format(GREGORIAN_API_DATE_FORMAT);
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

    const time = timeMatch[1];
    const format =
      time.length > 5 ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
    const parsed = dayjs(`${apiDate} ${time}`, format, true);
    return parsed.isValid() ? parsed.toISOString() : null;
  }

  if (/T|\d{1,2}:\d{2}/.test(trimmed)) {
    const parsed = dayjs(trimmed);
    if (parsed.isValid()) return parsed.toISOString();
  }

  const dateOnly = parseImportDateToApiDate(trimmed);
  if (dateOnly) {
    return dayjs(dateOnly).startOf('day').toISOString();
  }

  return null;
}

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
