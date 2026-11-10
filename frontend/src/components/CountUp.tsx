import { useCountUp } from '../utils/useCountUp';

/** A whole number that rolls up to `value`, e.g. a streak or a percent. */
export function CountUp({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  return (
    <>
      {Math.round(useCountUp(value))}
      {suffix}
    </>
  );
}
