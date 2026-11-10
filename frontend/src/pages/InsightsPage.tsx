import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getInsights, type InsightRange, type Insights } from '../api/insights';
import { getStats, type Stats } from '../api/stats';
import { CompletionChart } from '../components/CompletionChart';
import { CountUp } from '../components/CountUp';
import { HabitEmoji } from '../components/HabitEmoji';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { addDays } from '../utils/dates';
import './InsightsPage.css';

const RANGES: { value: InsightRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const RANGE_WORD: Record<InsightRange, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

/** "3 Nov", "November 2026": a date (UTC midnight) in words. */
const say = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    ...options,
  });

/** What the ‹ › arrows show: "This week", "27 Oct – 2 Nov", "October 2026", "2025". */
function periodLabel(insights: Insights): string {
  const { range, from, to, isCurrent } = insights;
  if (range === 'year') return from.slice(0, 4);
  if (range === 'month') return say(from, { month: 'long', year: 'numeric' });
  if (isCurrent) return 'This week';
  const short = { day: 'numeric', month: 'short' } as const;
  return `${say(from, short)} – ${say(to, { ...short, year: 'numeric' })}`;
}

/**
 * Up or down compared with the period before: "▲ 12% vs last week".
 * Null when either period has nothing to count.
 */
function trend(insights: Insights): { text: string; direction: string } | null {
  const {
    completionRate: now,
    previousRate: before,
    range,
    isCurrent,
  } = insights;
  if (now === null || before === null) return null;
  const than = `${isCurrent ? 'last' : 'the previous'} ${range}`;
  const change = now - before;
  if (change === 0) return { text: `Same as ${than}`, direction: 'same' };
  return {
    text: `${change > 0 ? '▲' : '▼'} ${Math.abs(change)}% vs ${than}`,
    direction: change > 0 ? 'up' : 'down',
  };
}

/** Which bar is today's (week, month) or this month's (year); -1 for a past period. */
function currentBar(insights: Insights, today: string): number {
  if (!insights.isCurrent) return -1;
  if (insights.range === 'year') return Number(today.slice(5, 7)) - 1;
  let index = 0;
  for (let d = insights.from; d < today; d = addDays(d, 1)) index++;
  return today <= insights.to ? index : -1;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The Insights tab: this week / month / year in numbers, then all-time numbers. */
export function InsightsPage() {
  const [stats, setStats] = useState<Stats | null>(null); // all-time numbers
  const [range, setRange] = useState<InsightRange>('week');
  // A day in the period shown; undefined = this week, month or year.
  const [anchor, setAnchor] = useState<string | undefined>(undefined);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getStats()
      .then((data) => {
        if (!ignore) setStats(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(errorMessage(err, 'Could not load your stats.'));
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Load the numbers again whenever Week / Month / Year or the period changes.
  useEffect(() => {
    let ignore = false;
    getInsights(range, anchor)
      .then((data) => {
        if (!ignore) setInsights(data);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(errorMessage(err, 'Could not load your insights.'));
      });
    return () => {
      ignore = true;
    };
  }, [range, anchor]);

  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (!stats) {
    return <p className="status-message">Loading…</p>;
  }

  // The numbers for the range and period picked (null while they load).
  const shown =
    insights &&
    insights.range === range &&
    (anchor === undefined
      ? insights.isCurrent
      : insights.from <= anchor && anchor <= insights.to)
      ? insights
      : null;
  const change = shown && trend(shown); // up or down vs the period before

  return (
    // On wide screens: the range and chart on the left, top habits and all time on the right.
    <div className="insights-page wide">
      <h2 className="insights-title">Insights</h2>

      <div className="two-col">
        <div className="col">
          <Segmented
            label="Range"
            options={RANGES}
            value={range}
            onChange={(next) => {
              setRange(next);
              setAnchor(undefined); // back to this week, month or year
            }}
          />

          {!shown ? (
            <p className="status-message">Loading…</p>
          ) : (
            <>
              {/* ‹ earlier period · later period › */}
              <div className="period-nav">
                <button
                  type="button"
                  className="round-button"
                  onClick={() => setAnchor(addDays(shown.from, -1))}
                  disabled={!shown.hasEarlier}
                  aria-label="Earlier"
                >
                  ‹
                </button>
                <span className="period-label">{periodLabel(shown)}</span>
                <button
                  type="button"
                  className="round-button"
                  onClick={() => setAnchor(addDays(shown.to, 1))}
                  disabled={shown.isCurrent}
                  aria-label="Later"
                >
                  ›
                </button>
              </div>

              <ul className="insights-tiles">
                <li className="card insights-tile">
                  <span className="insights-tile-icon is-flame">
                    <Icon name="flame" size={28} />
                  </span>
                  {/* Today's streak; for a past period, its best run instead. */}
                  <strong>
                    <CountUp
                      value={
                        shown.isCurrent ? shown.dayStreak : shown.bestStreak
                      }
                    />
                  </strong>
                  <span>{shown.isCurrent ? 'Day streak' : 'Best streak'}</span>
                </li>
                <li className="card insights-tile">
                  <span className="insights-tile-icon">
                    <Icon name="target" size={28} />
                  </span>
                  <strong>
                    {shown.completionRate === null ? (
                      '–'
                    ) : (
                      <CountUp value={shown.completionRate} suffix="%" />
                    )}
                  </strong>
                  <span>{RANGE_WORD[range]} completion</span>
                  {change && (
                    <small className={`insights-trend is-${change.direction}`}>
                      {change.text}
                    </small>
                  )}
                </li>
              </ul>

              <section className="card insights-section">
                <h3>Completion</h3>
                <CompletionChart
                  // A new chart per period, so a clicked day doesn't carry over.
                  key={`${shown.range}-${shown.from}`}
                  bars={shown.bars}
                  highlight={currentBar(shown, stats.today)}
                  dense={range === 'month'}
                  initials={range === 'year'}
                />
              </section>
            </>
          )}
        </div>

        <div className="col">
          {shown && (
            <section className="insights-section">
              <h3>Top habits</h3>
              {shown.topHabits.length === 0 ? (
                <p className="insights-empty">
                  Your habits will show up here once you have some.
                </p>
              ) : (
                <ul className="card top-habits">
                  {shown.topHabits.map((habit) => (
                    <li key={habit.id}>
                      <HabitEmoji
                        emoji={habit.emoji}
                        name={habit.name}
                        size={36}
                      />
                      <span className="top-habit-text">
                        <span className="top-habit-name">{habit.name}</span>
                        <span className="top-habit-days">
                          {habit.doneDays}/{habit.possibleDays} days
                        </span>
                      </span>
                      <span className="top-habit-rate">
                        {habit.rate === null ? '–' : `${habit.rate}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Since you started, across every habit (archived ones too). */}
          <section className="insights-section">
            <h3>All time</h3>
            <ul className="insights-tiles is-three">
              <li className="card insights-tile is-small">
                <strong>{stats.bestStreak}</strong>
                <span>best streak</span>
              </li>
              <li className="card insights-tile is-small">
                <strong>{stats.perfectDays}</strong>
                <span>perfect days</span>
              </li>
              <li className="card insights-tile is-small">
                <strong>{stats.totalCompletions}</strong>
                <span>habits ticked</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
