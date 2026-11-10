import { useCountUp } from '../utils/useCountUp';
import './ProgressRing.css';

interface ProgressRingProps {
  percent: number; // 0-100
  size?: number;
}

/**
 * A circle that fills up in the app colour, with the percent in the middle.
 * The ring and the number roll to a new value together, and the ring gives a
 * little pop when it reaches 100%.
 */
export function ProgressRing({ percent, size = 92 }: ProgressRingProps) {
  const shown = useCountUp(percent);
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      // A new key at 100% restarts the pop animation each time it's reached.
      key={percent === 100 ? 'full' : 'filling'}
      className={`progress-ring${percent === 100 ? ' is-full' : ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${percent}% done`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-surface-muted)"
        strokeWidth={stroke}
      />
      {/* strokeDasharray draws only part of the circle: the done part. */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(circumference * shown) / 100} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--color-text)"
        fontSize={size * 0.22}
        fontWeight={800}
      >
        {Math.round(shown)}%
      </text>
    </svg>
  );
}
