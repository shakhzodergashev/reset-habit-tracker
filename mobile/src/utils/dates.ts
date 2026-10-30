// Date helpers for the phone. Calendar dates are "YYYY-MM-DD" text, like everywhere else in RESET.
// Day maths and labels use UTC so a date never shifts by a day.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toUtcDate = (date: string) => new Date(`${date}T00:00:00Z`);

/** Today's date in `timeZone` (the user's saved zone), as "YYYY-MM-DD". Same result as the backend. */
export function todayInTimeZone(timeZone: string): string {
  // formatToParts gives year, month and day separately, whatever the phone's language is.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Moves a "YYYY-MM-DD" date forward (positive) or back (negative) by whole days. */
export function addDays(date: string, days: number): string {
  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

/** "2026-10-31" -> "Saturday, 31 October" */
export function formatLongDate(date: string): string {
  const d = toUtcDate(date);
  return `${WEEKDAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "2026-10-31" -> "Sat" */
export function formatWeekday(date: string): string {
  return WEEKDAYS[toUtcDate(date).getUTCDay()];
}

/** "2026-10-31" -> "31" */
export function formatDayOfMonth(date: string): string {
  return String(toUtcDate(date).getUTCDate());
}
