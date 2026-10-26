import { addDays } from '../common/dates/dates';

/**
 * How many days in a row the habit has been done, up to now.
 *
 * - `completedDates`: the days the habit was done, as "YYYY-MM-DD", in any order.
 * - `today`: today's date in the user's own time zone.
 *
 * Approved rule: if today is not done *yet*, the streak is still alive and is
 * counted up to yesterday. It only breaks once a whole day passes without it.
 *
 * Calculated fresh every time (never stored), so fixing a past day
 * immediately gives the right streak and no midnight job is needed.
 */
export function currentStreak(
  completedDates: Iterable<string>,
  today: string,
): number {
  const done = new Set(completedDates);

  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
