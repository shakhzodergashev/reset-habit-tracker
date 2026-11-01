import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { listDone, markDone, undoDone } from '../api/completions';
import type { Habit } from '../api/dashboard';
import { getHabit } from '../api/habits';
import { useAuth } from '../auth/auth-context';
import { HabitEmoji } from '../components/HabitEmoji';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { addDays, formatLongDate, todayInTimeZone } from '../utils/dates';
import './HabitDetailPage.css';

type Tab = 'progress' | 'history';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "2026-10" -> the first and last day of that month. */
function monthDays(month: string): string[] {
  const first = `${month}-01`;
  const days: string[] = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  return days;
}

/** "2026-10" -> "October 2026" */
function formatMonth(month: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

/** One month earlier or later: "2026-10", +1 -> "2026-11". */
function shiftMonth(month: string, by: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + by);
  return date.toISOString().slice(0, 7);
}

/** /habits/:id: one habit's progress (a month calendar) and history. */
export function HabitDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const today = todayInTimeZone(user?.timeZone ?? 'UTC');
  const [habit, setHabit] = useState<Habit | null>(null);
  const [tab, setTab] = useState<Tab>('progress');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getHabit(id)
      .then((data) => {
        if (!ignore) setHabit(data);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(
            err instanceof ApiError &&
              (err.status === 404 || err.status === 400)
              ? 'Habit not found.'
              : 'Could not load this habit.',
          );
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  /** After a day is ticked or unticked: reload, so the streaks are up to date. */
  function reloadHabit() {
    getHabit(id)
      .then(setHabit)
      .catch(() => {
        // Keep the old numbers; the next visit will correct them.
      });
  }

  if (error) {
    return (
      <section className="card welcome">
        <h2>{error}</h2>
        <Link to="/habits">Back to your habits</Link>
      </section>
    );
  }
  if (!habit) {
    return <p className="status-message">Loading…</p>;
  }

  return (
    <div className="habit-detail">
      <div className="habit-detail-bar">
        <Link to="/habits" aria-label="Back to habits">
          <Icon name="back" size={26} />
        </Link>
        <Link to={`/habits/${habit.id}/edit`}>Edit</Link>
      </div>

      <header className="habit-detail-head">
        <HabitEmoji emoji={habit.emoji} name={habit.name} size={96} />
        <h2>{habit.name}</h2>
        <p>
          {habit.description ?? 'Daily'}
          {habit.isArchived && ' · Archived'}
        </p>
      </header>

      <Segmented
        label="View"
        options={[
          { value: 'progress', label: 'Progress' },
          { value: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'progress' ? (
        <>
          <MonthCalendar habit={habit} today={today} onChanged={reloadHabit} />
          <ul className="streak-tiles">
            <li className="card streak-tile">
              <span className="streak-icon is-flame">
                <Icon name="flame" size={28} />
              </span>
              <strong>
                {habit.currentStreak}{' '}
                {habit.currentStreak === 1 ? 'day' : 'days'}
              </strong>
              <span>Current streak</span>
            </li>
            <li className="card streak-tile">
              <span className="streak-icon is-trophy">
                <Icon name="trophy" size={28} />
              </span>
              <strong>
                {habit.bestStreak} {habit.bestStreak === 1 ? 'day' : 'days'}
              </strong>
              <span>Best streak</span>
            </li>
          </ul>
        </>
      ) : (
        <History habit={habit} today={today} />
      )}
    </div>
  );
}

/** A month of days; done days are filled purple. Tap a day to tick or untick it. */
function MonthCalendar({
  habit,
  today,
  onChanged,
}: {
  habit: Habit;
  today: string;
  onChanged: () => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [done, setDone] = useState<Set<string> | null>(null);
  const [pendingDay, setPendingDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const days = monthDays(month);

  useEffect(() => {
    let ignore = false;
    const all = monthDays(month);
    listDone(habit.id, all[0], all[all.length - 1])
      .then((dates) => {
        if (!ignore) setDone(new Set(dates));
      })
      .catch(() => {
        if (!ignore) setError('Could not load this month.');
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, month]);

  async function toggle(day: string) {
    if (!done) return;
    setError(null);
    setPendingDay(day);
    try {
      if (done.has(day)) {
        await undoDone(habit.id, day);
      } else {
        await markDone(habit.id, day);
      }
      const next = new Set(done);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      setDone(next);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that.');
    } finally {
      setPendingDay(null);
    }
  }

  // Empty cells before the 1st, so it lands under the right weekday.
  const blanks = (new Date(`${days[0]}T00:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <section className="card month-calendar">
      <div className="month-calendar-bar">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Previous month"
        >
          <Icon name="back" />
        </button>
        <h3>{formatMonth(month)}</h3>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={month >= today.slice(0, 7)}
          aria-label="Next month"
        >
          <Icon name="next" />
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <ul className="month-grid">
        {WEEKDAYS.map((day) => (
          <li key={day} className="month-weekday" aria-hidden="true">
            {day}
          </li>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <li key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const isDone = done?.has(day) ?? false;
          const disabled =
            !done ||
            day > today ||
            day < habit.startDate ||
            habit.isArchived ||
            pendingDay !== null;
          return (
            <li key={day}>
              <button
                type="button"
                className={`month-day${day === today ? ' is-today' : ''}`}
                aria-pressed={isDone}
                aria-label={`${formatLongDate(day)}: ${isDone ? 'done' : 'not done'}`}
                disabled={disabled}
                onClick={() => void toggle(day)}
              >
                {isDone ? '✓' : Number(day.slice(8))}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The days this habit was done in the last 90 days, newest first. */
function History({ habit, today }: { habit: Habit; today: string }) {
  const [dates, setDates] = useState<string[] | null>(null);

  useEffect(() => {
    let ignore = false;
    listDone(habit.id, addDays(today, -89), today)
      .then((data) => {
        if (!ignore) setDates([...data].reverse());
      })
      .catch(() => {
        if (!ignore) setDates([]);
      });
    return () => {
      ignore = true;
    };
  }, [habit.id, today]);

  if (!dates) return <p className="status-message">Loading…</p>;
  if (dates.length === 0) {
    return <p className="status-message">No ticks in the last 90 days yet.</p>;
  }
  return (
    <ul className="card history-list">
      {dates.map((date) => (
        <li key={date}>
          <span className="history-tick" aria-hidden="true">
            ✓
          </span>
          {formatLongDate(date)}
        </li>
      ))}
    </ul>
  );
}
