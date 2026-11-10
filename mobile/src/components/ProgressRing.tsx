import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';
import { prefersReducedMotion, useCountUp } from '../utils/useCountUp';

/**
 * A circle that fills up in the app colour, with the percent in the middle.
 * The ring and the number roll to a new value together, and the ring gives a
 * little pop when it reaches 100%.
 */
export function ProgressRing({ percent, size = 84 }: { percent: number; size?: number }) {
  const c = useTheme();
  const shown = useCountUp(percent);
  const pop = useRef(new Animated.Value(1)).current;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // All habits done: pop once, after the ring has finished filling.
  useEffect(() => {
    if (percent !== 100 || prefersReducedMotion()) return;
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(pop, { toValue: 1.12, duration: 220, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [percent, pop]);

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ scale: pop }] }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.ringTrack}
          strokeWidth={stroke}
          fill="none"
        />
        {/* strokeDasharray draws only part of the circle: the done part. */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * shown) / 100} ${circumference}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: c.text }}>
          {Math.round(shown)}%
        </Text>
      </View>
    </Animated.View>
  );
}
