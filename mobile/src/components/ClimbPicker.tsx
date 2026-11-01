import { Text, View } from 'react-native';
import { CLIMB_LENGTHS } from '../api/habits';
import { space, useTheme } from '../theme';
import { Segmented } from './Segmented';

/** A short line about each length, shown under the switch. */
const ABOUT: Record<number, string> = {
  30: 'A quick first win.',
  66: 'About how long a new habit takes to become automatic.',
  100: 'A big milestone.',
  365: 'The whole year.',
};

interface ClimbPickerProps {
  value: number;
  onChange: (goalDays: number) => void;
  disabled?: boolean;
}

/** A switch with four choices (30, 66, 100, 365 days). */
export function ClimbPicker({ value, onChange, disabled }: ClimbPickerProps) {
  const c = useTheme();

  return (
    <View style={{ gap: space[2] }}>
      <Segmented
        label="Climb length"
        options={CLIMB_LENGTHS.map((days) => ({ value: days as number, label: String(days) }))}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <Text style={{ fontSize: 14, color: c.textMuted }}>
        <Text style={{ fontWeight: '700', color: c.text }}>{value} days.</Text> {ABOUT[value]}
      </Text>
    </View>
  );
}
