import { useState } from 'react';
import { ApiError } from '../api/client';
import {
  DEFAULT_CLIMB,
  startClimb,
  type Climb,
  type Stats,
} from '../api/stats';
import { useWeather } from '../journey/useWeather';
import { formatDays } from '../utils/emoji';
import { ClimbPicker } from './ClimbPicker';
import { HillScene } from './HillScene';
import './ClimbCard.css';

/** The current climb's hill: the finish flag is the climb's last day. */
export function ClimbHill({ climb }: { climb: Climb }) {
  const weather = useWeather();
  return (
    <section className="card climb-hill">
      <HillScene
        progress={climb.journeyDays / climb.goalDays}
        weather={weather}
        gainText={(gained) => `+${formatDays(gained * climb.goalDays)} day`}
        label={`Your climb: ${formatDays(climb.journeyDays)} of ${climb.goalDays} days`}
        rideInOnOpen // every visit: ride up from the bottom to where you are
      />
      <p className="climb-hill-text">
        <span>Your climb</span>
        <span>
          <strong>{formatDays(climb.journeyDays)}</strong> of {climb.goalDays}{' '}
          days
        </span>
      </p>
    </section>
  );
}

/** Pick a length and start a climb: the first one, or the next one after finishing. */
export function StartClimbCard({
  title,
  text,
  buttonLabel,
  onStarted,
}: {
  title: string;
  text: string;
  buttonLabel: string;
  onStarted: (stats: Stats) => void;
}) {
  const [goalDays, setGoalDays] = useState(DEFAULT_CLIMB);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      onStarted(await startClimb(goalDays));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not start the climb.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card start-climb">
      <h3>{title}</h3>
      <p>{text}</p>
      <ClimbPicker
        value={goalDays}
        onChange={setGoalDays}
        disabled={isSaving}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        type="button"
        onClick={() => void handleStart()}
        disabled={isSaving}
      >
        {isSaving ? 'Starting…' : buttonLabel}
      </button>
    </section>
  );
}
