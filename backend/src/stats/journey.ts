/** How long a climb up the journey hill can be, in days. The user picks one. */
export const CLIMB_LENGTHS = [30, 66, 100, 365] as const;
export type ClimbLength = (typeof CLIMB_LENGTHS)[number];

/** A time the habit was archived (all dates "YYYY-MM-DD"). */
export interface Pause {
  archivedOn: string; // the last day the habit still counts
  restoredOn: string | null; // the first day it counts again; null = still archived
}

export interface HabitHistory {
  startDate: string; // "YYYY-MM-DD"
  pauses?: Pause[];
  completionDates: string[]; // "YYYY-MM-DD"
}

/** A habit with its done days in a Set, for quick "done on this day?" checks. */
export type PreparedHabit = HabitHistory & { done: Set<string> };

export function withDoneSet<T extends HabitHistory>(
  habit: T,
): T & { done: Set<string> } {
  return { ...habit, done: new Set(habit.completionDates) };
}

/**
 * Does the habit take part in this day? Yes once it has started, except while
 * it was put away (after the day archived, before the day restored). A habit
 * done on a day always takes part in it. "YYYY-MM-DD" strings compare like dates.
 */
export function takesPart(habit: PreparedHabit, date: string): boolean {
  if (date < habit.startDate) return false;
  if (habit.done.has(date)) return true;
  return !(habit.pauses ?? []).some(
    (p) =>
      p.archivedOn < date && (p.restoredOn === null || date < p.restoredOn),
  );
}

export interface JourneyStats {
  journeyDays: number; // how far up the hill, e.g. 12.75 (two decimals)
  perfectDays: number; // days where every habit was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
}

/**
 * Each day is worth 1 journey day, shared by the habits that were part of it:
 * started, and not put away (between the day archived and the day restored).
 * A habit done on a day always takes part in it, even inside a pause.
 * With 4 habits, each one done that day adds 1/4; all 4 done = a full day.
 * Missed days add nothing and take nothing away. Dates after `today` are ignored,
 * and so are dates before `from` (the day a climb started), when it is given.
 */
export function journeyStats(
  habits: HabitHistory[],
  today: string,
  from?: string,
): JourneyStats {
  const prepared = habits.map(withDoneSet);
  const habitsOn = (date: string) =>
    prepared.filter((h) => takesPart(h, date)).length;
  const isOn = takesPart;

  const doneOn = new Map<string, number>(); // date -> how many habits done that day
  for (const habit of prepared) {
    for (const date of habit.done) {
      if (!isOn(habit, date) || date > today) continue;
      if (from !== undefined && date < from) continue;
      doneOn.set(date, (doneOn.get(date) ?? 0) + 1);
    }
  }

  let journey = 0;
  let perfectDays = 0;
  let totalCompletions = 0;
  for (const [date, done] of doneOn) {
    const total = habitsOn(date);
    journey += done / total;
    if (done === total) perfectDays++;
    totalCompletions += done;
  }

  return {
    journeyDays: Math.round(journey * 100) / 100,
    perfectDays,
    activeDays: doneOn.size,
    totalCompletions,
  };
}
