// Habit calls. Shapes match what the backend's /habits routes send.
import { apiRequest } from './client';
import type { Habit } from './dashboard';

/** What the habit form sends. */
export interface HabitInput {
  name: string;
  description: string | null;
  color: string; // "#RRGGBB"
}

export function createHabit(input: HabitInput): Promise<Habit> {
  return apiRequest<Habit>('/habits', { method: 'POST', body: input });
}

export function getHabit(id: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}`);
}

export function updateHabit(id: string, input: HabitInput): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}`, { method: 'PATCH', body: input });
}
