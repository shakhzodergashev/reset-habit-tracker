import type { Climber } from '../journey/kid';
import { Segmented } from './Segmented';

interface ClimberPickerProps {
  value: Climber;
  onChange: (climber: Climber) => void;
  disabled?: boolean;
}

/** Who climbs the hill: the boy or the girl. */
export function ClimberPicker({ value, onChange, disabled }: ClimberPickerProps) {
  return (
    <Segmented
      label="Who climbs the hill?"
      options={[
        { value: 'boy', label: '🧒 Boy' },
        { value: 'girl', label: '👧 Girl' },
      ]}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
