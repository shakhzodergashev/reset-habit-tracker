import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { listDone, markDone, undoDone } from '../api/completions';
import type { Habit } from '../api/dashboard';
import {
  addDays,
  formatDayOfMonth,
  formatLongDate,
  formatWeekday,
} from '../utils/dates';
import './RecentDays.css';

const DAYS_SHOWN = 14;

interface RecentDaysProps {
  habit: Habit;
  today: string; // the user's today, "YYYY-MM-DD"
  onChanged: () => void; // tell the parent to reload the habit (for the new streak)
}

/** The last 14 days of a habit. Tap a day to mark it done or undo it. */
export function RecentDays({ habit, today, onChanged }: RecentDaysProps) {
  const from = addDays(today, -(DAYS_SHOWN - 1));
  // Oldest first: 13 days ago ... today.
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(from, i));

  // null = still loading. A Set answers "is this day done?" instantly.
  const [doneDays, setDoneDays] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDay, setPendingDay] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    listDone(habit.id, from, today)
      .then((dates) => {
        if (!ignore) setDoneDays(new Set(dates));
      })
      .catch(() => {
        if (!ignore) setError('Could not load the recent days.');
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, from, today]);

  async function toggleDay(day: string) {
    if (!doneDays) return;
    const wasDone = doneDays.has(day);
    setError(null);
    setPendingDay(day);

    try {
      if (wasDone) {
        await undoDone(habit.id, day);
      } else {
        await markDone(habit.id, day);
      }
      // Never change state in place: build a new Set so React notices and redraws.
      setDoneDays((current) => {
        const next = new Set(current);
        if (wasDone) {
          next.delete(day);
        } else {
          next.add(day);
        }
        return next;
      });
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not save that day.',
      );
    } finally {
      setPendingDay(null);
    }
  }

  return (
    <section className="card recent-days">
      <div className="recent-days-header">
        <h3>Last {DAYS_SHOWN} days</h3>
        <span className="recent-days-streak">
          🔥 {habit.currentStreak}-day streak
        </span>
      </div>

      {habit.isArchived ? (
        <p className="recent-days-note">
          Restore this habit to change its days.
        </p>
      ) : (
        <p className="recent-days-note">
          Forgot to mark a day? Tap it. Tap again to undo.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!doneDays ? (
        !error && <p className="status-message">Loading…</p>
      ) : (
        <ul className="day-grid">
          {days.map((day) => {
            const done = doneDays.has(day);
            const beforeStart = day < habit.startDate;
            const disabled =
              beforeStart || habit.isArchived || pendingDay !== null;

            return (
              <li key={day}>
                <button
                  type="button"
                  className={`day${day === today ? ' is-today' : ''}`}
                  aria-pressed={done}
                  aria-label={`${formatLongDate(day)}: ${
                    beforeStart
                      ? 'before this habit started'
                      : done
                        ? 'done'
                        : 'not done'
                  }`}
                  disabled={disabled}
                  onClick={() => void toggleDay(day)}
                >
                  <span className="day-weekday">{formatWeekday(day)}</span>
                  <span className="day-number">{formatDayOfMonth(day)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
