// The Insights call. Shapes match what GET /insights sends.
import { apiRequest } from './client';

export type InsightRange = 'week' | 'month' | 'year';

export interface Insights {
  range: InsightRange;
  from: string; // "YYYY-MM-DD": the first day of this week, month or year
  to: string;
  dayStreak: number; // days in a row with at least one habit done
  completionRate: number | null; // 0-100; null = nothing to count yet
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

export function getInsights(range: InsightRange): Promise<Insights> {
  return apiRequest<Insights>(`/insights?range=${range}`);
}
