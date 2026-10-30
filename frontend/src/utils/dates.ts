// Date helpers for the browser. Calendar dates are "YYYY-MM-DD" text, like on the backend.
// All the maths and formatting happen in UTC so a date never shifts by a day.

/** Today's date in `timeZone` (the user's saved zone), as "YYYY-MM-DD". Same logic as the backend. */
export function todayInTimeZone(timeZone: string): string {
  // The 'en-CA' locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Moves a "YYYY-MM-DD" date forward (positive) or back (negative) by whole days. */
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    ...options,
  });
}

/** "2026-10-30" -> "Friday, 30 October" */
export function formatLongDate(date: string): string {
  return format(date, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "2026-10-30" -> "Fri" */
export function formatWeekday(date: string): string {
  return format(date, { weekday: 'short' });
}

/** "2026-10-30" -> "30" */
export function formatDayOfMonth(date: string): string {
  return format(date, { day: 'numeric' });
}
