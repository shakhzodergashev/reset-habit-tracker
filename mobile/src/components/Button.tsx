import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, space } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

/** RESET's button. Pressable is React Native's "something you can tap". */
export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      // style can be a function: `pressed` is true while the finger is down.
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </Pressable>
  );
}

// In React Native, styles are JavaScript objects (no CSS files).
const styles = StyleSheet.create({
  base: {
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.bg, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  dimmed: { opacity: 0.6 },
  text: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondaryText: { color: colors.text },
});
