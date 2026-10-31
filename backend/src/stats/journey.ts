/** The whole hill is one year. */
export const YEAR_DAYS = 365;

export interface HabitHistory {
  startDate: string; // "YYYY-MM-DD"
  completionDates: string[]; // "YYYY-MM-DD"
}

export interface JourneyStats {
  journeyDays: number; // how far up the hill, e.g. 12.75 (two decimals)
  perfectDays: number; // days where every habit was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
}

/**
 * Each day is worth 1 journey day, shared by the habits that existed on it.
 * With 4 habits, each one done that day adds 1/4; all 4 done = a full day.
 * Missed days add nothing and take nothing away. Dates after `today` are ignored.
 */
export function journeyStats(
  habits: HabitHistory[],
  today: string,
): JourneyStats {
  // "YYYY-MM-DD" strings sort the same way as the dates they stand for.
  const startDates = habits.map((h) => h.startDate).sort();
  const habitsOn = (date: string) =>
    startDates.filter((start) => start <= date).length;

  const doneOn = new Map<string, number>(); // date -> how many habits done that day
  for (const habit of habits) {
    for (const date of habit.completionDates) {
      if (date < habit.startDate || date > today) continue;
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
