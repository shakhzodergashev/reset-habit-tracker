import { useEffect, useRef, useState } from 'react';

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that rolls smoothly to `target`: from 0 the first time, then from
 * where it was whenever `target` changes. It slows down at the end ("ease out").
 * With "reduce motion" switched on, it jumps straight to the target.
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(() => (reduceMotion() ? target : 0));
  const current = useRef(value); // the number on screen right now

  useEffect(() => {
    const ms = reduceMotion() ? 0 : duration; // 0 = jump on the next frame
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3; // fast at first, gentle at the end
      current.current = from + (target - from) * eased;
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame); // a new target takes over from here
  }, [target, duration]);

  return value;
}
