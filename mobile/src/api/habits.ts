// Habit, dashboard and completion calls, the same as on the website.
import { apiRequest } from './client';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null; // the user's own emoji, e.g. "💧"; null = none
  startDate: string; // "YYYY-MM-DD"
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  currentStreak: number;
  bestStreak: number; // the longest run of days in a row, ever
  completedToday: boolean;
}

/** A habit on the dashboard, with whether it was done on the chosen day. */
export interface DashboardHabit extends Habit {
  completedOnDate: boolean;
}

export interface Dashboard {
  today: string; // "YYYY-MM-DD", in the user's own time zone
  date: string; // the day shown: today, or a past day picked in the week strip
  timeZone: string;
  completedCount: number; // on `date`
  totalCount: number; // habits that had started by `date`
  habits: DashboardHabit[]; // not done that day first, then done
}

export type InsightRange = 'week' | 'month' | 'year';

/** What GET /insights sends. */
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

/** What the habit form sends. */
export interface HabitInput {
  name: string;
  description: string | null;
  emoji: string | null; // one emoji, or null for none
}

/** The climb lengths the user can pick, the same as the backend's. */
export const CLIMB_LENGTHS = [30, 66, 100, 365] as const;
export const DEFAULT_CLIMB = 66;

export interface Climb {
  goalDays: number; // 30, 66, 100 or 365
  startDate: string; // "YYYY-MM-DD"
  journeyDays: number; // how far up this climb, e.g. 12.75
  isComplete: boolean;
}

/** What GET /stats sends. */
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
  return apiRequest<Stats>('/climbs/current', { method: 'PATCH', body: { goalDays } });
}

/** The home screen for `date` ("YYYY-MM-DD"), or for today when it's left out. */
export function getDashboard(date?: string): Promise<Dashboard> {
  return apiRequest<Dashboard>(date ? `/dashboard?date=${date}` : '/dashboard');
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

export function listDone(habitId: string, from: string, to: string): Promise<string[]> {
  return apiRequest<string[]>(`/habits/${habitId}/completions?from=${from}&to=${to}`);
}
