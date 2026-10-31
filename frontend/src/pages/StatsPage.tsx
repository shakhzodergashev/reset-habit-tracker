import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getStats, type Stats } from '../api/stats';
import { HillScene } from '../components/HillScene';
import { useWeather } from '../journey/useWeather';
import { formatDays } from '../utils/emoji';
import './StatsPage.css';

/** The Stats tab: the year-long hill, and the numbers behind it. */
export function StatsPage() {
  const weather = useWeather();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getStats()
      .then((data) => {
        if (!ignore) setStats(data);
      })
      .catch((err: unknown) => {
        if (!ignore)
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load your stats.',
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Stats</h2>
        <p>Your year, one day at a time</p>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !stats ? (
        <p className="status-message">Loading…</p>
      ) : (
        <>
          {/* The year hill: 365 journey days = the finish flag. */}
          <section className="card stats-hill">
            <HillScene
              progress={stats.journeyDays / stats.yearDays}
              weather={weather}
              gainText={(gained) =>
                `+${formatDays(gained * stats.yearDays)} day`
              }
              label={`Year hill: ${formatDays(stats.journeyDays)} of ${stats.yearDays} days`}
            />
            <p className="stats-hill-text">
              <strong>{formatDays(stats.journeyDays)}</strong> of{' '}
              {stats.yearDays} days climbed
            </p>
          </section>

          <ul className="stats-grid">
            <StatTile
              value={`${Math.round((stats.journeyDays / stats.yearDays) * 1000) / 10}%`}
              label="of the year’s hill climbed"
            />
            <StatTile
              value={String(stats.perfectDays)}
              label="perfect days (every habit done)"
            />
            <StatTile
              value={String(stats.activeDays)}
              label="days with at least one habit"
            />
            <StatTile
              value={String(stats.totalCompletions)}
              label="habits ticked in total"
            />
          </ul>

          <section className="card stats-explain">
            <h3>How the climb works</h3>
            <p>
              The hill is one year: {stats.yearDays} days. Every day you do all
              your habits, the cyclist rides one full day up.
            </p>
            <p>
              A day is shared by your habits. You have{' '}
              <strong>{stats.habitCount}</strong>{' '}
              {stats.habitCount === 1 ? 'habit' : 'habits'}, so each tick is
              worth{' '}
              <strong>
                {stats.habitCount > 0
                  ? `${formatDays(1 / stats.habitCount)} of a day`
                  : 'nothing yet'}
              </strong>
              . Missed days never take you back down.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <li className="card stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </li>
  );
}
