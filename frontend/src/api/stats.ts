// The stats call. Shapes match what GET /stats sends.
import { apiRequest } from './client';

export interface Stats {
  today: string; // "YYYY-MM-DD"
  yearDays: number; // the whole hill: 365
  habitCount: number; // active habits
  journeyDays: number; // how far up the hill, e.g. 12.75
  perfectDays: number; // days where every habit was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
}

export function getStats(): Promise<Stats> {
  return apiRequest<Stats>('/stats');
}
