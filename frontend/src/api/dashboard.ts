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
  completedToday: boolean;
}

export interface Dashboard {
  today: string; // "YYYY-MM-DD", in the user's own time zone
  timeZone: string;
  completedCount: number;
  totalCount: number;
  journeyDays: number; // how far up the 365-day hill, e.g. 12.75
  habits: Habit[]; // unfinished first, then done
}

export function getDashboard(): Promise<Dashboard> {
  return apiRequest<Dashboard>('/dashboard');
}
