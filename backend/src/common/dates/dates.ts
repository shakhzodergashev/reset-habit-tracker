// Date and time-zone helpers.
// Calendar dates are always passed around as "YYYY-MM-DD" strings.

/** Returns true if `timeZone` is a real IANA time zone, such as "Asia/Tashkent". */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    // Intl throws a RangeError for unknown time zones.
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns today's calendar date in `timeZone` as "YYYY-MM-DD".
 * `now` can be passed in tests to pretend it is a specific moment.
 */
export function todayInTimeZone(
  timeZone: string,
  now: Date = new Date(),
): string {
  // The 'en-CA' locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Returns true if `value` is a real calendar date written as "YYYY-MM-DD". */
export function isValidDateString(value: string): boolean {
  // 1. Shape check: 4 digits, dash, 2 digits, dash, 2 digits.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  // 2. Real-date check: JavaScript turns "2026-02-30" into 2 March,
  //    so a fake date will not survive the round trip unchanged.
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/**
 * Moves a "YYYY-MM-DD" date forward (positive `days`) or back (negative `days`).
 * The math is done in UTC because UTC has no daylight-saving clock changes.
 */
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// Prisma reads and writes DATE columns as JavaScript Date objects at UTC midnight.
// Always convert through these two functions so the date never shifts by a day.

/** Converts "YYYY-MM-DD" into the Date that Prisma expects for a DATE column. */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** Converts a Date read from a DATE column back into "YYYY-MM-DD". */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
