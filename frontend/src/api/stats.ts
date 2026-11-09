// All-time numbers for Insights. Shapes match what GET /stats sends.
import { apiRequest } from './client';

export interface Stats {
  today: string; // "YYYY-MM-DD"
  habitCount: number; // active habits
  perfectDays: number; // days where every habit was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
  bestStreak: number; // the longest run of days in a row of any habit, ever
}

export function getStats(): Promise<Stats> {
  return apiRequest<Stats>('/stats');
}
