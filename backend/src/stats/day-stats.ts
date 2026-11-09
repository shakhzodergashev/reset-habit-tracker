// All-time day numbers for Insights, and the rule for which habits take part in
// a day, which Insights uses too.

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

export interface DayStats {
  perfectDays: number; // days where every habit taking part was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
}

/**
 * Counts the days with ticks. A day is perfect when every habit taking part in
 * it was done: started, and not put away (between the day archived and the day
 * restored). A habit done on a day always takes part in it. Dates after
 * `today` are ignored.
 */
export function dayStats(habits: HabitHistory[], today: string): DayStats {
  const prepared = habits.map(withDoneSet);
  const habitsOn = (date: string) =>
    prepared.filter((h) => takesPart(h, date)).length;

  const doneOn = new Map<string, number>(); // date -> how many habits done that day
  for (const habit of prepared) {
    for (const date of habit.done) {
      if (!takesPart(habit, date) || date > today) continue;
      doneOn.set(date, (doneOn.get(date) ?? 0) + 1);
    }
  }

  let perfectDays = 0;
  let totalCompletions = 0;
  for (const [date, done] of doneOn) {
    if (done === habitsOn(date)) perfectDays++;
    totalCompletions += done;
  }
  return { perfectDays, activeDays: doneOn.size, totalCompletions };
}
