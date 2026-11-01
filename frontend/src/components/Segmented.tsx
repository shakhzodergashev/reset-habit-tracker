import './Segmented.css';

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string; // what screen readers call the switch, e.g. "Range"
  disabled?: boolean;
}

/** A switch with a few choices; exactly one is picked (like Week / Month / Year). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled,
}: SegmentedProps<T>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className="segmented-option"
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
