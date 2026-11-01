import { Link } from 'react-router';
import type { Habit } from '../api/dashboard';
import { HabitEmoji } from './HabitEmoji';
import './HabitCard.css';

interface HabitCardProps {
  habit: Habit;
  done: boolean; // done on the day shown
  onToggle?: () => void; // the tick circle: mark done, or undo (left out = no tick)
  isPending?: boolean; // true while the request for this row is in flight
}

/** One habit row: tick circle, name and streak, and its emoji. The row opens the habit. */
export function HabitCard({
  habit,
  done,
  onToggle,
  isPending,
}: HabitCardProps) {
  return (
    <article className={`card habit-card${done ? ' is-done' : ''}`}>
      {onToggle && (
        <button
          type="button"
          className="habit-tick"
          aria-pressed={done} // tells screen readers whether it's "on" (done) or "off"
          aria-label={`${habit.name}: ${done ? 'done, tap to undo' : 'not done, tap to mark done'}`}
          onClick={onToggle}
          disabled={isPending}
        >
          {done && '✓'}
        </button>
      )}

      <Link className="habit-open" to={`/habits/${habit.id}`}>
        <span className="habit-text">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-meta">
            🔥 {habit.currentStreak}-day streak
            {habit.description && ` · ${habit.description}`}
          </span>
        </span>
        <HabitEmoji emoji={habit.emoji} name={habit.name} size={40} />
      </Link>
    </article>
  );
}
