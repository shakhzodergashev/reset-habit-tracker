import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { markDone, undoDone } from '../api/completions';
import {
  getDashboard,
  type Dashboard,
  type DashboardHabit,
} from '../api/dashboard';
import { HabitCard } from '../components/HabitCard';
import { HillScene } from '../components/HillScene';
import { Icon } from '../components/Icon';
import { ProgressRing } from '../components/ProgressRing';
import { WeekStrip } from '../components/WeekStrip';
import { useWeather } from '../journey/useWeather';
import './DashboardPage.css';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Today tab: the week, today's climb (with the real weather) and your habits. */
export function DashboardPage() {
  const weather = useWeather();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [date, setDate] = useState<string | undefined>(undefined); // undefined = today
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);

  // Load the day: when the page opens, and again when another day is picked.
  useEffect(() => {
    let ignore = false; // set to true if the page goes away before the answer arrives

    getDashboard(date)
      .then((data) => {
        if (!ignore) setDashboard(data);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setLoadError(errorMessage(err, 'Could not load your habits.'));
      });

    // Cleanup: React calls this when the page goes away (or the day changes).
    return () => {
      ignore = true;
    };
  }, [date]);

  /** The tick circle: mark it done for the day shown, or undo it, then reload. */
  async function toggleHabit(habit: DashboardHabit) {
    if (!dashboard) return;
    setActionError(null);
    setPendingHabitId(habit.id);

    try {
      if (habit.completedOnDate) {
        await undoDone(habit.id, dashboard.date);
      } else {
        await markDone(habit.id, dashboard.date);
      }
      // Reload so the counts, order and streaks are exactly what the server calculated.
      setDashboard(await getDashboard(dashboard.date));
    } catch (err) {
      setActionError(
        errorMessage(err, 'Could not save that. Please try again.'),
      );
    } finally {
      setPendingHabitId(null);
    }
  }

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
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const isToday = dashboard.date === dashboard.today;

  return (
    <div className="dashboard">
      <WeekStrip
        today={dashboard.today}
        selected={dashboard.date}
        onSelect={(day) => setDate(day === dashboard.today ? undefined : day)}
      />

      {/* The climb for the day shown: each habit done moves the cyclist one share up. */}
      <section className="card today-climb">
        <HillScene
          // A new hill when another day is picked, so the cyclist starts from there.
          key={dashboard.date}
          progress={total === 0 ? 0 : done / total}
          weather={weather}
          gainText={() => '+1 ✓'}
          label={`${isToday ? 'Today' : 'That day'}: ${done} of ${total} habits done`}
        />
        <div className="daily-progress">
          <div>
            <h2>{isToday ? 'Daily Progress' : 'That day'}</h2>
            <p>
              {done} of {total} habits
              {total > 0 && done === total && ' · finished! 🎉'}
            </p>
          </div>
          <ProgressRing percent={percent} />
        </div>
      </section>

      <div className="section-title">
        <h2>Habits</h2>
        <Link className="round-button" to="/habits/new" aria-label="New habit">
          <Icon name="plus" />
        </Link>
      </div>

      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}

      {dashboard.habits.length === 0 ? (
        <section className="card welcome">
          <h2>No habits yet</h2>
          <p>Tap + to create your first one.</p>
        </section>
      ) : (
        <ul className="habit-list">
          {/* One row per habit. key tells React which row is which. */}
          {dashboard.habits.map((habit) => (
            <li key={habit.id}>
              <HabitCard
                habit={habit}
                done={habit.completedOnDate}
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
