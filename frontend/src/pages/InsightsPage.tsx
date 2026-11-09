import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getInsights, type InsightRange, type Insights } from '../api/insights';
import { getStats, type Stats } from '../api/stats';
import { BarChart } from '../components/BarChart';
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

/** Which bar is today's (week, month) or this month's (year). */
function currentBar(insights: Insights, today: string): number {
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

  // Load the numbers again whenever Week / Month / Year changes.
  useEffect(() => {
    let ignore = false;
    getInsights(range)
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
  }, [range]);

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

  // The numbers for the range picked (null while they load).
  const shown = insights && insights.range === range ? insights : null;

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
            onChange={setRange}
          />

          {!shown ? (
            <p className="status-message">Loading…</p>
          ) : (
            <>
              <ul className="insights-tiles">
                <li className="card insights-tile">
                  <span className="insights-tile-icon is-flame">
                    <Icon name="flame" size={28} />
                  </span>
                  <strong>{shown.dayStreak}</strong>
                  <span>Day streak</span>
                </li>
                <li className="card insights-tile">
                  <span className="insights-tile-icon">
                    <Icon name="target" size={28} />
                  </span>
                  <strong>
                    {shown.completionRate === null
                      ? '–'
                      : `${shown.completionRate}%`}
                  </strong>
                  <span>{RANGE_WORD[range]} completion</span>
                </li>
              </ul>

              <section className="card insights-section">
                <h3>Completion</h3>
                <BarChart
                  bars={shown.bars}
                  highlight={currentBar(shown, stats.today)}
                  showEvery={range === 'month' ? 5 : 1}
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
