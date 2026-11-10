import { useState } from 'react';
import './CompletionChart.css';

interface CompletionChartProps {
  bars: { label: string; rate: number | null }[]; // rate 0-100, null = nothing yet
  highlight: number; // the index of today's bar (or this month's), -1 for none
  // Many thin bars (a month): only round days get a label, and a % shows on
  // the bar you click instead of on every one.
  dense?: boolean;
  // Show only the first letter of each label under the bars ("Jan" -> "J").
  initials?: boolean;
}

const DENSE_LABELS = new Set(['1', '5', '10', '15', '20', '25', '30']);

/**
 * Completion bars from 0% to 100%, with the current one in full colour and the
 * % above each bar (week, year) or above the one you click (month).
 */
export function CompletionChart({
  bars,
  highlight,
  dense = false,
  initials = false,
}: CompletionChartProps) {
  const [selected, setSelected] = useState(highlight);
  const picked = bars[selected];

  return (
    <div className="chart-wrap">
      <div className="chart">
        <div className="chart-axis" aria-hidden="true">
          {[100, 75, 50, 25, 0].map((tick) => (
            <span key={tick}>{tick}%</span>
          ))}
        </div>
        <div className="chart-plot">
          <div className="chart-grid" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((line) => (
              <span key={line} />
            ))}
          </div>

          <ul className="chart-columns">
            {bars.map((bar, i) => {
              const value = bar.rate === null ? 'nothing yet' : `${bar.rate}%`;
              const mark = bar.rate !== null && (
                <>
                  {/* At least a sliver, so a 0% day still shows it was counted. */}
                  <span
                    className="chart-bar"
                    style={{ height: `${Math.max(bar.rate, 2)}%` }}
                  />
                  {(!dense || i === selected) && (
                    <span
                      className="chart-value"
                      style={{ bottom: `${bar.rate}%` }}
                    >
                      {bar.rate}%
                    </span>
                  )}
                </>
              );
              return (
                <li
                  key={`${bar.label}-${i}`}
                  className={i === highlight ? 'is-current' : undefined}
                >
                  {dense ? (
                    <button
                      type="button"
                      className={`chart-column${i === selected ? ' is-selected' : ''}`}
                      onClick={() => setSelected(i)}
                      aria-label={`Day ${bar.label}: ${value}`}
                      aria-pressed={i === selected}
                    >
                      {mark}
                    </button>
                  ) : (
                    <span
                      className="chart-column"
                      aria-label={`${bar.label}: ${value}`}
                    >
                      {mark}
                    </span>
                  )}
                  <span className="chart-label" aria-hidden="true">
                    {dense && !DENSE_LABELS.has(bar.label)
                      ? ''
                      : initials
                        ? bar.label.charAt(0)
                        : bar.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {dense && (
        <p className="chart-hint">
          {picked && picked.rate !== null
            ? `Day ${picked.label}: ${picked.rate}% of habits done`
            : 'Click a bar to see its %.'}
        </p>
      )}
    </div>
  );
}
