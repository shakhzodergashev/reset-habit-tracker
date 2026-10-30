// Marking a habit done for a day, and undoing it. `date` is "YYYY-MM-DD".
import { apiRequest } from './client';

export function markDone(habitId: string, date: string): Promise<void> {
  return apiRequest<void>(`/habits/${habitId}/completions/${date}`, {
    method: 'PUT',
  });
}

/** The days this habit was done between `from` and `to` (both included), oldest first. */
export function listDone(
  habitId: string,
  from: string,
  to: string,
): Promise<string[]> {
  return apiRequest<string[]>(
    `/habits/${habitId}/completions?from=${from}&to=${to}`,
  );
}

export function undoDone(habitId: string, date: string): Promise<void> {
  return apiRequest<void>(`/habits/${habitId}/completions/${date}`, {
    method: 'DELETE',
  });
}
