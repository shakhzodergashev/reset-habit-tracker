import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { markDone, undoDone } from '../api/completions';
import { getDashboard, type Dashboard, type Habit } from '../api/dashboard';
import { HabitCard } from '../components/HabitCard';
import { HillScene } from '../components/HillScene';
import { useWeather } from '../journey/useWeather';
import { formatLongDate } from '../utils/dates';
import './DashboardPage.css';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Today tab: today's climb (with the real weather) and one card per active habit. */
export function DashboardPage() {
  const weather = useWeather();
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
        if (!ignore)
          setLoadError(errorMessage(err, 'Could not load your habits.'));
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
      setActionError(
        errorMessage(err, 'Could not save that. Please try again.'),
      );
    } finally {
      setPendingHabitId(null);
    }
  }

  // Three possible states: error, still loading, or loaded.
  if (loadError) {
    return (
      <p className="form-error" role="alert">
        {loadError}
      </p>
    );
  }
  if (!dashboard) {
    return <p className="status-message">Loading your habits…</p>;
  }

  const done = dashboard.completedCount;
  const total = dashboard.totalCount;
  const message =
    total === 0
      ? 'Add a habit to start today’s climb.'
      : done === total
        ? 'You reached the finish. Great day! 🎉'
        : `${total - done} more to reach the finish.`;

  return (
    <div className="dashboard">
      <div className="dashboard-summary">
        <div>
          <h2>Today</h2>
          <p>{formatLongDate(dashboard.today)}</p>
        </div>
        <Link className="button button-primary" to="/habits/new">
          + New habit
        </Link>
      </div>

      {/* Today's climb: each habit done moves the cyclist one share up to the flag. */}
      <section className="card today-climb">
        <HillScene
          progress={total === 0 ? 0 : done / total}
          weather={weather}
          gainText={() => '+1 ✓'}
          label={`Today's climb: ${done} of ${total} habits done`}
        />
        <div className="today-climb-text">
          <span>
            <strong>
              {done} of {total}
            </strong>{' '}
            habits done
          </span>
          <span>{message}</span>
        </div>
      </section>

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      {dashboard.habits.length === 0 ? (
        <section className="card welcome">
          <h2>No habits yet</h2>
          <p>Tap “+ New habit” to create your first one.</p>
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
    </div>
  );
}
