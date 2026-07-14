import jalaali from 'jalaali-js';
import { addUtcDays, formatApiDate, parseApiDate } from './api-dates';

export type BuiltInHoliday = {
  date: string;
  titleFa: string;
  titleEn: string;
  source: 'iran-solar' | 'iran-lunar' | 'gregorian';
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function jalaliToApiDate(jy: number, jm: number, jd: number): string | null {
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null;
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

/** Fixed solar Iranian official holidays (same Jalali date every year). */
const FIXED_IRAN_SOLAR: Array<{
  jm: number;
  jd: number;
  titleFa: string;
  titleEn: string;
}> = [
  { jm: 1, jd: 1, titleFa: 'عید نوروز', titleEn: 'Nowruz' },
  { jm: 1, jd: 2, titleFa: 'عید نوروز', titleEn: 'Nowruz' },
  { jm: 1, jd: 3, titleFa: 'عید نوروز', titleEn: 'Nowruz' },
  { jm: 1, jd: 4, titleFa: 'عید نوروز', titleEn: 'Nowruz' },
  {
    jm: 1,
    jd: 12,
    titleFa: 'روز جمهوری اسلامی',
    titleEn: 'Islamic Republic Day',
  },
  { jm: 1, jd: 13, titleFa: 'سیزده‌بدر', titleEn: 'Sizdah Bedar' },
  {
    jm: 3,
    jd: 14,
    titleFa: 'رحلت امام خمینی',
    titleEn: 'Demise of Imam Khomeini',
  },
  { jm: 3, jd: 15, titleFa: 'قیام ۱۵ خرداد', titleEn: '15 Khordad Uprising' },
  {
    jm: 11,
    jd: 22,
    titleFa: 'پیروزی انقلاب اسلامی',
    titleEn: 'Victory of the Islamic Revolution',
  },
  {
    jm: 12,
    jd: 29,
    titleFa: 'ملی شدن صنعت نفت',
    titleEn: 'Oil Industry Nationalization Day',
  },
];

/** Fixed Gregorian holidays (observed internationally / May Day in Iran). */
const FIXED_GREGORIAN: Array<{
  month: number;
  day: number;
  titleFa: string;
  titleEn: string;
}> = [
  {
    month: 1,
    day: 1,
    titleFa: 'سال نوی میلادی',
    titleEn: "New Year's Day",
  },
  {
    month: 5,
    day: 1,
    titleFa: 'روز جهانی کارگر',
    titleEn: "International Workers' Day",
  },
  {
    month: 12,
    day: 25,
    titleFa: 'کریسمس',
    titleEn: 'Christmas Day',
  },
];

/**
 * Published lunar / observational Iranian holidays keyed by Gregorian date.
 * Covers 1403–1406 roughly (2024–2028). Extended years can be added later.
 */
const IRAN_LUNAR_BY_GREGORIAN: Record<
  string,
  { titleFa: string; titleEn: string }
> = {
  // 1403 / late 2024 – early 2025
  '2024-04-01': {
    titleFa: 'عید فطر',
    titleEn: 'Eid al-Fitr',
  },
  '2024-04-02': {
    titleFa: 'تعطیلی عید فطر',
    titleEn: 'Eid al-Fitr Holiday',
  },
  '2024-06-16': { titleFa: 'عید قربان', titleEn: 'Eid al-Adha' },
  '2024-06-24': { titleFa: 'عید غدیر خم', titleEn: 'Eid al-Ghadir' },
  '2024-07-16': { titleFa: 'تاسوعای حسینی', titleEn: 'Tasua' },
  '2024-07-17': { titleFa: 'عاشورای حسینی', titleEn: 'Ashura' },
  '2024-08-25': { titleFa: 'اربعین حسینی', titleEn: 'Arbaeen' },
  '2024-09-02': {
    titleFa: 'رحلت پیامبر و شهادت امام حسن',
    titleEn: 'Demise of the Prophet / Martyrdom of Imam Hasan',
  },
  '2024-09-03': {
    titleFa: 'شهادت امام رضا',
    titleEn: 'Martyrdom of Imam Reza',
  },
  '2024-09-11': {
    titleFa: 'شهادت امام حسن عسکری',
    titleEn: 'Martyrdom of Imam Hasan al-Askari',
  },
  '2024-09-20': {
    titleFa: 'میلاد پیامبر و امام صادق',
    titleEn: 'Birth of the Prophet / Imam Sadiq',
  },
  '2025-01-28': {
    titleFa: 'شهادت حضرت فاطمه',
    titleEn: 'Martyrdom of Fatimah',
  },
  '2025-03-01': { titleFa: 'ولادت امام علی', titleEn: 'Birth of Imam Ali' },
  '2025-03-14': { titleFa: 'مبعث پیامبر', titleEn: "Prophet's Mab'ath" },
  '2025-03-20': {
    titleFa: 'ولادت حضرت قائم',
    titleEn: 'Birth of Imam Mahdi',
  },

  // 1404 / 2025–2026
  '2025-03-22': { titleFa: 'عید فطر', titleEn: 'Eid al-Fitr' },
  '2025-03-23': {
    titleFa: 'تعطیلی عید فطر',
    titleEn: 'Eid al-Fitr Holiday',
  },
  '2025-03-31': {
    titleFa: 'شهادت امام جعفر صادق',
    titleEn: 'Martyrdom of Imam Sadiq',
  },
  '2025-06-06': { titleFa: 'عید قربان', titleEn: 'Eid al-Adha' },
  '2025-06-14': { titleFa: 'عید غدیر خم', titleEn: 'Eid al-Ghadir' },
  '2025-07-05': { titleFa: 'تاسوعای حسینی', titleEn: 'Tasua' },
  '2025-07-06': { titleFa: 'عاشورای حسینی', titleEn: 'Ashura' },
  '2025-08-14': { titleFa: 'اربعین حسینی', titleEn: 'Arbaeen' },
  '2025-08-22': {
    titleFa: 'رحلت پیامبر و شهادت امام حسن',
    titleEn: 'Demise of the Prophet / Martyrdom of Imam Hasan',
  },
  '2025-08-23': {
    titleFa: 'شهادت امام رضا',
    titleEn: 'Martyrdom of Imam Reza',
  },
  '2025-08-31': {
    titleFa: 'شهادت امام حسن عسکری',
    titleEn: 'Martyrdom of Imam Hasan al-Askari',
  },
  '2025-09-09': {
    titleFa: 'میلاد پیامبر و امام صادق',
    titleEn: 'Birth of the Prophet / Imam Sadiq',
  },
  '2026-01-17': {
    titleFa: 'شهادت حضرت فاطمه',
    titleEn: 'Martyrdom of Fatimah',
  },
  '2026-02-18': { titleFa: 'ولادت امام علی', titleEn: 'Birth of Imam Ali' },
  '2026-03-03': { titleFa: 'مبعث پیامبر', titleEn: "Prophet's Mab'ath" },
  '2026-03-09': {
    titleFa: 'ولادت حضرت قائم',
    titleEn: 'Birth of Imam Mahdi',
  },
  '2026-03-19': {
    titleFa: 'شهادت امام علی',
    titleEn: 'Martyrdom of Imam Ali',
  },

  // 1405 / 2026–2027 (from official calendar listings)
  '2026-03-21': { titleFa: 'عید فطر', titleEn: 'Eid al-Fitr' },
  '2026-03-22': {
    titleFa: 'تعطیلی عید فطر',
    titleEn: 'Eid al-Fitr Holiday',
  },
  '2026-04-14': {
    titleFa: 'شهادت امام جعفر صادق',
    titleEn: 'Martyrdom of Imam Sadiq',
  },
  '2026-05-27': { titleFa: 'عید قربان', titleEn: 'Eid al-Adha' },
  '2026-06-04': { titleFa: 'عید غدیر خم', titleEn: 'Eid al-Ghadir' },
  '2026-06-24': { titleFa: 'تاسوعای حسینی', titleEn: 'Tasua' },
  '2026-06-25': { titleFa: 'عاشورای حسینی', titleEn: 'Ashura' },
  '2026-08-04': { titleFa: 'اربعین حسینی', titleEn: 'Arbaeen' },
  '2026-08-12': {
    titleFa: 'رحلت پیامبر و شهادت امام حسن',
    titleEn: 'Demise of the Prophet / Martyrdom of Imam Hasan',
  },
  '2026-08-21': {
    titleFa: 'شهادت امام حسن عسکری',
    titleEn: 'Martyrdom of Imam Hasan al-Askari',
  },
  '2026-08-30': {
    titleFa: 'میلاد پیامبر و امام صادق',
    titleEn: 'Birth of the Prophet / Imam Sadiq',
  },
  '2026-11-13': {
    titleFa: 'شهادت حضرت فاطمه',
    titleEn: 'Martyrdom of Fatimah',
  },
  '2026-12-22': { titleFa: 'ولادت امام علی', titleEn: 'Birth of Imam Ali' },
  '2027-01-05': { titleFa: 'مبعث پیامبر', titleEn: "Prophet's Mab'ath" },
  '2027-01-23': {
    titleFa: 'ولادت حضرت قائم',
    titleEn: 'Birth of Imam Mahdi',
  },
  '2027-02-28': {
    titleFa: 'شهادت امام علی',
    titleEn: 'Martyrdom of Imam Ali',
  },
  '2027-03-10': { titleFa: 'عید فطر', titleEn: 'Eid al-Fitr' },
  '2027-03-11': {
    titleFa: 'تعطیلی عید فطر',
    titleEn: 'Eid al-Fitr Holiday',
  },
};

function eachApiDateInclusive(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = parseApiDate(from);
  const end = parseApiDate(to);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatApiDate(cursor));
    cursor = addUtcDays(cursor, 1);
  }
  return dates;
}

function jalaliYearOfApiDate(apiDate: string): number {
  const [gy, gm, gd] = apiDate.split('-').map(Number);
  return jalaali.toJalaali(gy, gm, gd).jy;
}

function addLeapEsfand30(jy: number, out: Map<string, BuiltInHoliday>): void {
  if (!jalaali.isLeapJalaaliYear(jy)) return;
  const date = jalaliToApiDate(jy, 12, 30);
  if (!date) return;
  out.set(date, {
    date,
    titleFa: 'ملی شدن صنعت نفت',
    titleEn: 'Oil Industry Nationalization Day',
    source: 'iran-solar',
  });
}

/**
 * Built-in holidays that should count as non-working days.
 * Includes Iranian solar/lunar holidays and common Gregorian ones.
 */
export function getBuiltInHolidays(
  fromApi: string,
  toApi: string,
): BuiltInHoliday[] {
  const byDate = new Map<string, BuiltInHoliday>();

  const startJy = jalaliYearOfApiDate(fromApi) - 1;
  const endJy = jalaliYearOfApiDate(toApi) + 1;
  for (let jy = startJy; jy <= endJy; jy += 1) {
    for (const holiday of FIXED_IRAN_SOLAR) {
      const date = jalaliToApiDate(jy, holiday.jm, holiday.jd);
      if (!date || date < fromApi || date > toApi) continue;
      byDate.set(date, {
        date,
        titleFa: holiday.titleFa,
        titleEn: holiday.titleEn,
        source: 'iran-solar',
      });
    }
    addLeapEsfand30(jy, byDate);
  }

  for (const apiDate of eachApiDateInclusive(fromApi, toApi)) {
    const [, month, day] = apiDate.split('-').map(Number);

    for (const holiday of FIXED_GREGORIAN) {
      if (holiday.month === month && holiday.day === day) {
        // Prefer Iranian/rail religious names if already present that day.
        if (!byDate.has(apiDate)) {
          byDate.set(apiDate, {
            date: apiDate,
            titleFa: holiday.titleFa,
            titleEn: holiday.titleEn,
            source: 'gregorian',
          });
        }
      }
    }

    const lunar = IRAN_LUNAR_BY_GREGORIAN[apiDate];
    if (lunar) {
      byDate.set(apiDate, {
        date: apiDate,
        titleFa: lunar.titleFa,
        titleEn: lunar.titleEn,
        source: 'iran-lunar',
      });
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function pickHolidayTitle(
  holiday: Pick<BuiltInHoliday, 'titleFa' | 'titleEn'> | null | undefined,
  locale: 'fa' | 'en' = 'fa',
): string | null {
  if (!holiday) return null;
  return locale === 'en' ? holiday.titleEn : holiday.titleFa;
}
