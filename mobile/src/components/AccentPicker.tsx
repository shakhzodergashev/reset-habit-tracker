import { Pressable, Text, View } from 'react-native';
import { ACCENTS, type Accent } from '../accents';
import { space, useTheme } from '../theme';

interface AccentPickerProps {
  value: Accent;
  onChange: (accent: Accent) => void;
  disabled?: boolean;
}

/** A row of colour dots; the picked one has a ring and a tick. */
export function AccentPicker({ value, onChange, disabled }: AccentPickerProps) {
  const c = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="App colour"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}
    >
      {(Object.keys(ACCENTS) as Accent[]).map((accent) => {
        const selected = accent === value;
        return (
          <Pressable
            key={accent}
            onPress={() => onChange(accent)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={ACCENTS[accent].label}
            accessibilityState={{ selected, disabled }}
            hitSlop={4}
            // The ring: a border in the text colour, with a gap before the dot.
            style={({ pressed }) => ({
              padding: 3,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: selected ? c.text : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                // The light-mode shade: it reads well on both light and dark cards.
                backgroundColor: ACCENTS[accent].light.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected && (
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>✓</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
