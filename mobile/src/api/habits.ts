// Habit, dashboard and completion calls, the same as on the website.
import { apiRequest } from './client';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  color: string; // "#22AA88"
  startDate: string; // "YYYY-MM-DD"
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  currentStreak: number;
  completedToday: boolean;
}

export interface Dashboard {
  today: string; // "YYYY-MM-DD", in the user's own time zone
  timeZone: string;
  completedCount: number;
  totalCount: number;
  habits: Habit[]; // unfinished first, then done
}

/** What the habit form sends. */
export interface HabitInput {
  name: string;
  description: string | null;
  color: string;
}

export function getDashboard(): Promise<Dashboard> {
  return apiRequest<Dashboard>('/dashboard');
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

export function listHabits(archived: boolean): Promise<Habit[]> {
  return apiRequest<Habit[]>(`/habits?archived=${archived}`);
}

export function archiveHabit(id: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}/archive`, { method: 'POST' });
}

export function restoreHabit(id: string): Promise<Habit> {
  return apiRequest<Habit>(`/habits/${id}/restore`, { method: 'POST' });
}

export function markDone(habitId: string, date: string): Promise<void> {
  return apiRequest<void>(`/habits/${habitId}/completions/${date}`, {
    method: 'PUT',
  });
}

export function undoDone(habitId: string, date: string): Promise<void> {
  return apiRequest<void>(`/habits/${habitId}/completions/${date}`, {
    method: 'DELETE',
  });
}

export function listDone(
  habitId: string,
  from: string,
  to: string,
): Promise<string[]> {
  return apiRequest<string[]>(
    `/habits/${habitId}/completions?from=${from}&to=${to}`,
  );
}
