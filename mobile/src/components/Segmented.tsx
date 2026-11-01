import { Pressable, Text, View } from 'react-native';
import { space, useTheme } from '../theme';

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string; // what VoiceOver calls the switch, e.g. "Range"
  disabled?: boolean;
}

/** A switch with a few choices, like the iPhone's segmented control (Week / Month / Year). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled,
}: SegmentedProps<T>) {
  const c = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 14,
        backgroundColor: c.surfaceMuted,
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              paddingVertical: space[2],
              borderRadius: 11,
              backgroundColor: selected ? c.accent : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: selected ? '700' : '600',
                color: selected ? c.onAccent : c.textMuted,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
