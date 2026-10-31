// Habit calls. Shapes match what the backend's /habits routes send.
import { apiRequest } from './client';
import type { Habit } from './dashboard';

/** What the habit form sends. */
export interface HabitInput {
  name: string;
  description: string | null;
  emoji: string | null; // one emoji, or null for none
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

/** Active habits, or archived ones with archived = true. Oldest first. */
export function listHabits(archived: boolean): Promise<Habit[]> {
  return apiRequest<Habit[]>(`/habits?archived=${archived}`);
}

/** Hides the habit from the dashboard. Its history is kept. */
export function archiveHabit(id: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}/archive`, { method: 'POST' });
}

/** Brings an archived habit back, with its history. */
export function restoreHabit(id: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}/restore`, { method: 'POST' });
}
