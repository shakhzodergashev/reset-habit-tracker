import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

/** A circle that fills up in purple, with the percent in the middle. */
export function ProgressRing({ percent, size = 84 }: { percent: number; size?: number }) {
  const c = useTheme();
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      style={{ width: size, height: size }}
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
          strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: c.text }}>{percent}%</Text>
      </View>
    </View>
  );
}
