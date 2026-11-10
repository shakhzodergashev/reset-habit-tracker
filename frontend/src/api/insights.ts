// The Insights call. Shapes match what GET /insights sends.
import { apiRequest } from './client';

export type InsightRange = 'week' | 'month' | 'year';

export interface Insights {
  range: InsightRange;
  from: string; // "YYYY-MM-DD": the first day of this week, month or year
  to: string;
  isCurrent: boolean; // this week, month or year (it has today in it)
  hasEarlier: boolean; // false = nothing to step back to with ‹
  dayStreak: number; // days in a row with at least one habit done, up to today
  bestStreak: number; // the longest such run inside this period
  completionRate: number | null; // 0-100; null = nothing to count yet
  previousRate: number | null; // the same for the period before; null = nothing to compare
  bars: { label: string; rate: number | null }[]; // days (week, month) or months (year)
  topHabits: {
    id: string;
    name: string;
    emoji: string | null;
    doneDays: number;
    possibleDays: number;
    rate: number | null;
  }[];
}

/** The week, month or year that `date` is in; this one when `date` is left out. */
export function getInsights(
  range: InsightRange,
  date?: string,
): Promise<Insights> {
  const day = date ? `&date=${date}` : '';
  return apiRequest<Insights>(`/insights?range=${range}${day}`);
}
