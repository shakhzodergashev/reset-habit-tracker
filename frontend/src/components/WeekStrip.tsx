import { addDays, formatDayOfMonth, formatWeekday } from '../utils/dates';
import './WeekStrip.css';

/** 0 = Monday ... 6 = Sunday, for "YYYY-MM-DD". */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

interface WeekStripProps {
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

/** This week, Monday to Sunday. Pick a day to see (and tick) its habits; future days are greyed out. */
export function WeekStrip({ today, selected, onSelect }: WeekStripProps) {
  const monday = addDays(today, -weekdayIndex(today));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="week-strip" role="group" aria-label="This week">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          className={`week-day${day === today ? ' is-today' : ''}`}
          aria-pressed={day === selected}
          disabled={day > today}
          onClick={() => onSelect(day)}
        >
          <span className="week-day-name">{formatWeekday(day)}</span>
          <span className="week-day-number">{formatDayOfMonth(day)}</span>
        </button>
      ))}
    </div>
  );
}
