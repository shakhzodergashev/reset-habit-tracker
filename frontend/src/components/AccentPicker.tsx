import { ACCENTS, type Accent } from '../accents';
import './AccentPicker.css';

interface AccentPickerProps {
  value: Accent;
  onChange: (accent: Accent) => void;
  disabled?: boolean;
}

/** A row of colour dots; the picked one has a ring and a tick. */
export function AccentPicker({ value, onChange, disabled }: AccentPickerProps) {
  return (
    <div className="accent-picker" role="radiogroup" aria-label="App colour">
      {(Object.keys(ACCENTS) as Accent[]).map((accent) => (
        <button
          key={accent}
          type="button"
          role="radio"
          aria-checked={accent === value}
          aria-label={ACCENTS[accent].label}
          title={ACCENTS[accent].label}
          className="accent-dot"
          // The light-mode shade: it reads well on both light and dark cards.
          style={{ background: ACCENTS[accent].light.accent }}
          onClick={() => onChange(accent)}
          disabled={disabled}
        >
          {accent === value && '✓'}
        </button>
      ))}
    </div>
  );
}
