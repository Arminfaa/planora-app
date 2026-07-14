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
