import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import type { Habit } from '../api/dashboard';
import { listHabits } from '../api/habits';
import { HabitCard } from '../components/HabitCard';
import { Icon } from '../components/Icon';
import './DashboardPage.css';

/** The Habits tab: every active habit (tap one to see its progress), and archived ones. */
export function HabitsPage() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    listHabits(false)
      .then((data) => {
        if (!ignore) setHabits(data);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load your habits.',
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="section-title">
        <h2>Habits</h2>
        <Link className="round-button" to="/habits/new" aria-label="New habit">
          <Icon name="plus" />
        </Link>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !habits ? (
        <p className="status-message">Loading…</p>
      ) : habits.length === 0 ? (
        <section className="card welcome">
          <h2>No habits yet</h2>
          <p>Tap + to create your first one.</p>
        </section>
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitCard habit={habit} done={habit.completedToday} />
            </li>
          ))}
        </ul>
      )}

      <Link className="dashboard-archived-link" to="/habits/archived">
        Archived habits
      </Link>
    </div>
  );
}
