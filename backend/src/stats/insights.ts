import { addDays } from '../common/dates/dates';
import { takesPart, withDoneSet, type HabitHistory } from './journey';

export const INSIGHT_RANGES = ['week', 'month', 'year'] as const;
export type InsightRange = (typeof INSIGHT_RANGES)[number];

/** A habit for Insights: its history plus what the Top habits list shows. */
export interface InsightHabit extends HabitHistory {
  id: string;
  name: string;
  emoji: string | null;
  isArchived: boolean;
}

export interface Bar {
  label: string; // "Mon", "14" or "Jan"
  rate: number | null; // 0-100; null = nothing to count yet (future, or no habits)
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** 0 = Monday ... 6 = Sunday. */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Every date from `from` to `to`, both included. */
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  return dates;
}

/** The first and last day of this week (Monday to Sunday), month or year. */
export function rangeDates(range: InsightRange, today: string) {
  const [year, month] = today.split('-');
  if (range === 'week') {
    const monday = addDays(today, -weekdayIndex(today));
    return { from: monday, to: addDays(monday, 6) };
  }
  if (range === 'month') {
    const from = `${year}-${month}-01`;
    const nextMonth = addDays(from, 32).slice(0, 8) + '01';
    return { from, to: addDays(nextMonth, -1) };
  }
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** done / possible as a whole percent, or null when there was nothing to do. */
function percent(done: number, possible: number): number | null {
  return possible === 0 ? null : Math.round((done / possible) * 100);
}

/**
 * The numbers for the Insights tab, for this week, month or year.
 * Only days up to today count. A habit takes part in a day by the same rule
 * as the climb (started, and not put away), see takesPart().
 */
export function insights(
  habits: InsightHabit[],
  range: InsightRange,
  today: string,
) {
  const prepared = habits.map(withDoneSet);
  const { from, to } = rangeDates(range, today);
  const days = datesBetween(from, to < today ? to : today);

  /** How many habits could be done and were done, on these days. */
  const tally = (dates: string[], only = prepared) => {
    let possible = 0;
    let done = 0;
    for (const date of dates) {
      for (const habit of only) {
        if (!takesPart(habit, date)) continue;
        possible++;
        if (habit.done.has(date)) done++;
      }
    }
    return { possible, done };
  };

  // Bars: each day of the week or month, or each month of the year.
  const bars: Bar[] =
    range === 'year'
      ? MONTHS.map((label, i) => {
          const prefix = `${from.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`;
          const { possible, done } = tally(
            days.filter((d) => d.startsWith(prefix)),
          );
          return { label, rate: percent(done, possible) };
        })
      : datesBetween(from, to).map((date) => {
          const { possible, done } = tally(date <= today ? [date] : []);
          return {
            label:
              range === 'week'
                ? WEEKDAYS[weekdayIndex(date)]
                : String(Number(date.slice(8))),
            rate: percent(done, possible),
          };
        });

  // Day streak: days in a row with at least one habit done. Like a habit's
  // streak, today not done yet doesn't break it.
  const anyDone = (date: string) => prepared.some((h) => h.done.has(date));
  let day = anyDone(today) ? today : addDays(today, -1);
  let dayStreak = 0;
  while (anyDone(day)) {
    dayStreak++;
    day = addDays(day, -1);
  }

  const total = tally(days);
  const topHabits = prepared
    .filter((h) => !h.isArchived)
    .map((h) => {
      const { possible, done } = tally(days, [h]);
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        doneDays: done,
        possibleDays: possible,
        rate: percent(done, possible),
      };
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  return {
    range,
    from,
    to,
    dayStreak,
    completionRate: percent(total.done, total.possible),
    bars,
    topHabits,
  };
}
