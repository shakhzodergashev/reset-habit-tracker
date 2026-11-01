// Stats and climb calls. Shapes match what GET /stats sends.
import { apiRequest } from './client';

/** The climb lengths the user can pick, the same as the backend's. */
export const CLIMB_LENGTHS = [30, 66, 100, 365] as const;
export const DEFAULT_CLIMB = 66;

export interface Climb {
  goalDays: number; // 30, 66, 100 or 365
  startDate: string; // "YYYY-MM-DD"
  journeyDays: number; // how far up this climb, e.g. 12.75
  isComplete: boolean;
}

export interface Stats {
  today: string; // "YYYY-MM-DD"
  habitCount: number; // active habits
  journeyDays: number; // all-time, across every climb
  perfectDays: number; // days where every habit was done
  activeDays: number; // days where at least one habit was done
  totalCompletions: number;
  climb: Climb | null; // null until the user picks their first climb
  climbsCompleted: number;
}

export function getStats(): Promise<Stats> {
  return apiRequest<Stats>('/stats');
}

/** Starts the first climb, or the next one once the current one is complete. */
export function startClimb(goalDays: number): Promise<Stats> {
  return apiRequest<Stats>('/climbs', { method: 'POST', body: { goalDays } });
}

/** Changes how long the current climb is. */
export function changeClimbLength(goalDays: number): Promise<Stats> {
  return apiRequest<Stats>('/climbs/current', {
    method: 'PATCH',
    body: { goalDays },
  });
}
