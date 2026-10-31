import { Pressable, Text } from 'react-native';
import { space, useTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

/** RESET's button. Pressable is React Native's "something you can tap". */
export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const c = useTheme();
  const background =
    variant === 'primary' ? c.accent : variant === 'danger' ? c.danger : c.surface;
  const textColor =
    variant === 'secondary' ? c.text : variant === 'primary' ? c.onAccent : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      // style can be a function: `pressed` is true while the finger is down.
      style={({ pressed }) => ({
        paddingVertical: space[3] + 2,
        paddingHorizontal: space[4],
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: background,
        borderWidth: 1,
        borderColor: variant === 'secondary' ? c.border : 'transparent',
        opacity: pressed || disabled ? 0.6 : 1,
      })}
    >
      <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}
