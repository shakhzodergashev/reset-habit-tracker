import { useState } from 'react';
import { useNavigate } from 'react-router';
import { browserTimeZone } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { ClimberPicker } from '../components/ClimberPicker';
import { TimeZonePicker } from '../components/TimeZonePicker';
import type { Climber } from '../journey/kid';

/**
 * /welcome: shown once, right after creating an account. Pick your climber
 * and check your time zone.
 */
export function WelcomePage() {
  const navigate = useNavigate();
  const { user, updateMe } = useAuth();
  const [climber, setClimber] = useState<Climber>(user?.climber ?? 'boy');
  // Filled in from this computer when the account was made; checked here.
  const [timeZone, setTimeZone] = useState(user?.timeZone ?? browserTimeZone());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      await updateMe({ climber, timeZone });
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not save your choices.',
      );
      setIsSaving(false);
    }
  }

  return (
    <section className="card welcome">
      <h2>Welcome to RESET 🚴</h2>
      <p>
        Every habit you tick moves your climber up the day’s hill. Two quick
        choices first; you can change them later in Profile.
      </p>

      <h3>Who climbs the hill?</h3>
      <ClimberPicker
        value={climber}
        onChange={setClimber}
        disabled={isSaving}
      />

      <h3>Where do you live?</h3>
      <p>Your day starts and ends at midnight in this time zone.</p>
      <TimeZonePicker
        value={timeZone}
        onChange={setTimeZone}
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
        {isSaving ? 'Saving…' : 'Let’s go'}
      </button>
    </section>
  );
}
