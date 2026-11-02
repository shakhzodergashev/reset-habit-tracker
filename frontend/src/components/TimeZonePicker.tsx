import { useEffect, useState } from 'react';
import { listTimeZones } from '../api/auth';

interface TimeZonePickerProps {
  value: string;
  onChange: (timeZone: string) => void;
  disabled?: boolean;
}

/** A drop-down of every time zone, e.g. "Asia/Tashkent". Type to jump to one. */
export function TimeZonePicker({
  value,
  onChange,
  disabled,
}: TimeZonePickerProps) {
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    listTimeZones()
      .then((list) => {
        if (!ignore) setZones(list);
      })
      .catch(() => {}); // the list stays as just the current zone
    return () => {
      ignore = true;
    };
  }, []);

  // Browsers sometimes use another spelling of a zone than the server's list
  // ("Asia/Kolkata" vs "Asia/Calcutta"), so the current one is always offered.
  const options = zones.includes(value) ? zones : [value, ...zones];

  return (
    <label className="field">
      <span>Time zone</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}
