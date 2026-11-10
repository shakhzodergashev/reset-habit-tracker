import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// The iPhone's "Reduce Motion" setting, kept up to date while the app runs.
let reduceMotion = false;
void AccessibilityInfo.isReduceMotionEnabled().then((on) => (reduceMotion = on));
AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => (reduceMotion = on));

/** True when the iPhone asks apps to keep movement to a minimum. */
export const prefersReducedMotion = () => reduceMotion;

/**
 * A number that rolls smoothly to `target`: from 0 the first time, then from
 * where it was whenever `target` changes. It slows down at the end ("ease out").
 * With Reduce Motion switched on, it jumps straight to the target.
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(() => (reduceMotion ? target : 0));
  const current = useRef(value); // the number on screen right now

  useEffect(() => {
    const ms = reduceMotion ? 0 : duration; // 0 = jump on the next frame
    const from = current.current;
    const start = Date.now();
    let frame = 0;
    const step = () => {
      const t = ms === 0 ? 1 : Math.min(1, (Date.now() - start) / ms);
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
