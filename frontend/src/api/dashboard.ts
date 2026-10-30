// The dashboard call. Shapes match what GET /dashboard sends.
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

export function getDashboard(): Promise<Dashboard> {
  return apiRequest<Dashboard>('/dashboard');
}
