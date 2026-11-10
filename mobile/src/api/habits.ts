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
export function getInsights(range: InsightRange, date?: string): Promise<Insights> {
  const day = date ? `&date=${date}` : '';
  return apiRequest<Insights>(`/insights?range=${range}${day}`);
}

/** What the habit form sends. */
export interface HabitInput {
  name: string;
  description: string | null;
  emoji: string | null; // one emoji, or null for none
}

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

/** Deletes the habit and all its ticks, for good. */
export function deleteHabit(id: string): Promise<void> {
  return apiRequest<void>(`/habits/${id}`, { method: 'DELETE' });
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
