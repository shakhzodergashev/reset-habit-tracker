import { Link } from 'react-router';
import type { Habit } from '../api/dashboard';
import './HabitCard.css';

interface HabitCardProps {
  habit: Habit;
  onToggle: () => void; // tap = mark done, or undo if already done
  isPending: boolean; // true while the request for this card is in flight
}

/** One habit on the dashboard: a big "done today" button, plus an Edit link. */
export function HabitCard({ habit, onToggle, isPending }: HabitCardProps) {
  const done = habit.completedToday;

  return (
    <article className={`card habit-card${done ? ' is-done' : ''}`}>
      <button
        type="button"
        className="habit-toggle"
        aria-pressed={done} // tells screen readers whether it's "on" (done) or "off"
        aria-label={`${habit.name}: ${done ? 'done today, tap to undo' : 'not done yet, tap to mark done'}`}
        onClick={onToggle}
        disabled={isPending}
      >
        {/* A circle in the habit's color: empty when not done, filled with a tick when done. */}
        <span
          className="habit-check"
          style={{
            borderColor: habit.color,
            backgroundColor: done ? habit.color : 'transparent',
          }}
          aria-hidden="true"
        >
          {done && '✓'}
        </span>

        <span className="habit-text">
          <span className="habit-name">{habit.name}</span>
          {habit.description && (
            <span className="habit-description">{habit.description}</span>
          )}
        </span>

        <span
          className="habit-streak"
          title={`${habit.currentStreak}-day streak`}
        >
          🔥 {habit.currentStreak}
        </span>
      </button>

      <Link
        className="habit-edit"
        to={`/habits/${habit.id}/edit`}
        aria-label={`Edit ${habit.name}`}
      >
        Edit
      </Link>
    </article>
  );
}
