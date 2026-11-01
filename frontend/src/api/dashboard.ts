// The dashboard call. Shapes match what GET /dashboard sends.
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

/** The home screen for `date` ("YYYY-MM-DD"), or for today when it's left out. */
export function getDashboard(date?: string): Promise<Dashboard> {
  return apiRequest<Dashboard>(date ? `/dashboard?date=${date}` : '/dashboard');
}
