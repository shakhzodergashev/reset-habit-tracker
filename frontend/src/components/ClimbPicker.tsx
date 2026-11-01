import { CLIMB_LENGTHS } from '../api/stats';
import { Segmented } from './Segmented';
import './ClimbPicker.css';

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

/** A switch with four choices (30, 66, 100, 365 days); exactly one is picked. */
export function ClimbPicker({ value, onChange, disabled }: ClimbPickerProps) {
  return (
    <div className="climb-picker">
      <Segmented
        label="Climb length"
        options={CLIMB_LENGTHS.map((days) => ({
          value: days as number,
          label: String(days),
        }))}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <p className="climb-about">
        <strong>{value} days.</strong> {ABOUT[value]}
      </p>
    </div>
  );
}
