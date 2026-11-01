interface ProgressRingProps {
  percent: number; // 0-100
  size?: number;
}

/** A circle that fills up in purple, with the percent in the middle. */
export function ProgressRing({ percent, size = 92 }: ProgressRingProps) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
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
        strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
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
        {percent}%
      </text>
    </svg>
  );
}
