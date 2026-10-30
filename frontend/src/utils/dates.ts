/**
 * Turns "2026-10-30" into "Friday, 30 October".
 *
 * new Date("2026-10-30") means midnight UTC. Formatting it in the browser's own
 * time zone could show 29 October in places behind UTC (the off-by-one-day bug),
 * so we always format it in UTC.
 */
export function formatLongDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
