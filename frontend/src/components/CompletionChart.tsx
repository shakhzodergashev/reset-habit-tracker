import './BarChart.css';

interface BarChartProps {
  bars: { label: string; rate: number | null }[]; // rate 0-100, null = nothing yet
  highlight: number; // the index of today's bar (or this month's), -1 for none
  showEvery?: number; // show every n-th label, when there are many bars
}

/** Completion bars from 0% to 100%, with the current one in full purple. */
export function BarChart({ bars, highlight, showEvery = 1 }: BarChartProps) {
  return (
    <div className="bar-chart">
      <div className="bar-chart-axis" aria-hidden="true">
        {[100, 75, 50, 25, 0].map((tick) => (
          <span key={tick}>{tick}%</span>
        ))}
      </div>
      <div className="bar-chart-plot">
        <div className="bar-chart-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} />
          ))}
        </div>
        <ul className="bar-chart-bars">
          {bars.map((bar, i) => (
            <li
              key={`${bar.label}-${i}`}
              className={i === highlight ? 'is-current' : undefined}
              aria-label={`${bar.label}: ${bar.rate === null ? 'nothing yet' : `${bar.rate}%`}`}
            >
              <span className="bar-chart-column">
                {bar.rate !== null && (
                  // At least a sliver, so a 0% day still shows it was counted.
                  <span
                    className="bar-chart-bar"
                    style={{ height: `${Math.max(bar.rate, 2)}%` }}
                  />
                )}
              </span>
              <span className="bar-chart-label">
                {i % showEvery === 0 || i === highlight ? bar.label : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
