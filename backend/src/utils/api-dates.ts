const API_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse YYYY-MM-DD into a UTC midnight Date. */
export function parseApiDate(value: string): Date {
  const match = API_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid API date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
}

export function formatApiDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function eachUtcDayInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = toUtcDayStart(from);
  const end = toUtcDayStart(to);

  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor);
    cursor = addUtcDays(cursor, 1);
  }

  return days;
}

export function utcWeekday(date: Date): number {
  return date.getUTCDay();
}

export function dayCountInclusive(from: Date, to: Date): number {
  const start = toUtcDayStart(from).getTime();
  const end = toUtcDayStart(to).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

/** Asia/Tehran offset without DST (since 2022): UTC+03:30 */
const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;

/** Calendar day key in Asia/Tehran (YYYY-MM-DD). */
export function formatTehranApiDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Tehran midnight for an API calendar day → UTC Instant. */
export function tehranMidnightToUtc(apiDate: string): Date {
  const date = parseApiDate(apiDate);
  return new Date(date.getTime() - TEHRAN_OFFSET_MS);
}

export function tehranRangeToUtcBounds(
  fromApi: string,
  toApi: string,
): { start: Date; endExclusive: Date } {
  const start = tehranMidnightToUtc(fromApi);
  const dayAfterTo = addUtcDays(parseApiDate(toApi), 1);
  const endExclusive = tehranMidnightToUtc(formatApiDate(dayAfterTo));
  return { start, endExclusive };
}

export function weekdayOfApiDate(apiDate: string): number {
  return parseApiDate(apiDate).getUTCDay();
}
