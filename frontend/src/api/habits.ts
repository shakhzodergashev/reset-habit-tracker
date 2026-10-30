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
