import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { markDone, undoDone } from '../api/completions';
import { getDashboard, type Dashboard, type Habit } from '../api/dashboard';
import { useAuth } from '../auth/auth-context';
import { HabitCard } from '../components/HabitCard';
import { formatLongDate } from '../utils/dates';
import './DashboardPage.css';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The home page: today's progress and one card per active habit. */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);

  // Load the dashboard once, when the page first appears.
  useEffect(() => {
    let ignore = false; // set to true if the page goes away before the answer arrives

    getDashboard()
      .then((data) => {
        if (!ignore) setDashboard(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setLoadError(errorMessage(err, 'Could not load your habits.'));
      });

    // Cleanup: React calls this when the page goes away.
    return () => {
      ignore = true;
    };
  }, []);

  /** Tap on a card: mark it done for today, or undo it, then reload the numbers. */
  async function toggleHabit(habit: Habit) {
    if (!dashboard) return;
    setActionError(null);
    setPendingHabitId(habit.id);

    try {
      // "Today" comes from the server, in the user's own time zone.
      if (habit.completedToday) {
        await undoDone(habit.id, dashboard.today);
      } else {
        await markDone(habit.id, dashboard.today);
      }
      // Reload so the count, order and streaks are exactly what the server calculated.
      setDashboard(await getDashboard());
    } catch (err) {
      setActionError(errorMessage(err, 'Could not save that. Please try again.'));
    } finally {
      setPendingHabitId(null);
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-bar">
        <span className="dashboard-user">{user?.email}</span>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => void logout()}
        >
          Log out
        </button>
      </div>

      {/* Three possible states: error, still loading, or loaded. */}
      {loadError ? (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      ) : !dashboard ? (
        <p className="status-message">Loading your habits…</p>
      ) : (
        <>
          <section className="dashboard-summary">
            <h2>{formatLongDate(dashboard.today)}</h2>
            <p>
              <strong>
                {dashboard.completedCount} / {dashboard.totalCount}
              </strong>{' '}
              completed
            </p>
          </section>

          {actionError && (
            <p className="form-error" role="alert">
              {actionError}
            </p>
          )}

          {dashboard.habits.length === 0 ? (
            <section className="card welcome">
              <h2>No habits yet</h2>
              <p>Creating habits arrives in the next milestone.</p>
            </section>
          ) : (
            <ul className="habit-list">
              {/* One card per habit. key tells React which card is which. */}
              {dashboard.habits.map((habit) => (
                <li key={habit.id}>
                  <HabitCard
                    habit={habit}
                    onToggle={() => void toggleHabit(habit)}
                    isPending={pendingHabitId === habit.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
