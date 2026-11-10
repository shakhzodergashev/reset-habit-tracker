import { addDays } from '../common/dates/dates';
import { takesPart, withDoneSet, type HabitHistory } from './day-stats';

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

/** The first and last day of the week (Monday to Sunday), month or year that `date` is in. */
export function rangeDates(range: InsightRange, date: string) {
  const [year, month] = date.split('-');
  if (range === 'week') {
    const monday = addDays(date, -weekdayIndex(date));
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
 * The numbers for the Insights tab, for the week, month or year that `date` is
 * in (this one by default). Only days up to today count. A habit takes part in a day by the same rule
 * as perfect days (started, and not put away), see takesPart().
 */
export function insights(
  habits: InsightHabit[],
  range: InsightRange,
  today: string,
  date: string = today,
) {
  const prepared = habits.map(withDoneSet);
  const { from, to } = rangeDates(range, date);
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

  // The longest run of days in a row with a habit done, inside this period.
  let bestStreak = 0;
  let run = 0;
  for (const date of days) {
    run = anyDone(date) ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  const total = tally(days);

  // The period just before (last week, month or year), to say "up" or "down".
  const previous = rangeDates(range, addDays(from, -1));
  const before = tally(datesBetween(previous.from, previous.to));
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
    isCurrent: from <= today && today <= to, // this week, month or year
    hasEarlier: prepared.some((h) => h.startDate < from), // anything to step back to?
    dayStreak,
    bestStreak,
    completionRate: percent(total.done, total.possible),
    previousRate: percent(before.done, before.possible), // null = nothing to compare
    bars,
    topHabits,
  };
}
