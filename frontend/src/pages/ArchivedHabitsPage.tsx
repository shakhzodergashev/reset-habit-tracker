import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import type { Habit } from '../api/dashboard';
import { listHabits, restoreHabit } from '../api/habits';
import './ArchivedHabitsPage.css';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** /habits/archived: archived habits, each with a Restore button. */
export function ArchivedHabitsPage() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    listHabits(true)
      .then((data) => {
        if (!ignore) setHabits(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setLoadError(errorMessage(err, 'Could not load archived habits.'));
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleRestore(habit: Habit) {
    setActionError(null);
    setPendingId(habit.id);
    try {
      await restoreHabit(habit.id);
      // Remove it from this list. (current) => ... always starts from the latest list.
      setHabits((current) =>
        current ? current.filter((h) => h.id !== habit.id) : current,
      );
    } catch (err) {
      setActionError(errorMessage(err, 'Could not restore the habit.'));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="archived-page">
      <div className="archived-header">
        <h2>Archived habits</h2>
        <Link to="/">← Back to today</Link>
      </div>

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      {loadError ? (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      ) : !habits ? (
        <p className="status-message">Loading…</p>
      ) : habits.length === 0 ? (
        <section className="card welcome">
          <h3>Nothing archived</h3>
          <p>Habits you archive from their Edit page will appear here.</p>
        </section>
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => (
            <li key={habit.id} className="card archived-item">
              <span
                className="archived-color"
                style={{ backgroundColor: habit.color }}
                aria-hidden="true"
              />
              <span className="archived-name">{habit.name}</span>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void handleRestore(habit)}
                disabled={pendingId === habit.id}
              >
                {pendingId === habit.id ? 'Restoring…' : 'Restore'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
