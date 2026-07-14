'use client';

import dayjs from 'dayjs';
import jalaliday from 'jalaliday/dayjs';
import { useLayoutEffect } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';

dayjs.extend(jalaliday);

/** Jalali month names for DatePicker panels when locale is FA. */
const FA_JALALI_DAYJS_LOCALE = {
  name: 'fa',
  weekdays: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split('_'),
  weekdaysShort: 'یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه'.split(
    '_',
  ),
  weekdaysMin: 'ی_د_س_چ_پ_ج_ش'.split('_'),
  weekStart: 6,
  months:
    'فروردین_اردیبهشت_خرداد_تیر_مرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند'.split(
      '_',
    ),
  monthsShort:
    'فروردین_اردیبهشت_خرداد_تیر_مرداد_شهریور_مهر_آبان_آذر_دی_بهمن_اسفند'.split(
      '_',
    ),
  ordinal: (n: number) => n,
  formats: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'YYYY/MM/DD',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm',
  },
  relativeTime: {
    future: 'در %s',
    past: '%s پیش',
    s: 'چند ثانیه',
    m: 'یک دقیقه',
    mm: '%d دقیقه',
    h: 'یک ساعت',
    hh: '%d ساعت',
    d: 'یک روز',
    dd: '%d روز',
    M: 'یک ماه',
    MM: '%d ماه',
    y: 'یک سال',
    yy: '%d سال',
  },
};

/**
 * Keep dayjs calendar mode aligned with the app locale:
 * FA → Jalali UI calendar, EN → Gregorian.
 * Driven by our LocaleProvider (more reliable than antd ConfigContext alone).
 */
export function DayjsCalendarSync() {
  const { locale } = useLocale();

  useLayoutEffect(() => {
    if (locale === 'fa') {
      // dayjs accepts a locale object with a `name` field.
      dayjs.locale(FA_JALALI_DAYJS_LOCALE as never);
      dayjs.calendar('jalali');
      return;
    }

    dayjs.locale('en');
    dayjs.calendar('gregory');
  }, [locale]);

  return null;
}
