import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { DEFAULT_CLIMB, startClimb } from '../api/stats';
import { ClimbPicker } from '../components/ClimbPicker';

/** /welcome: shown once, right after creating an account. Pick your first climb. */
export function WelcomePage() {
  const navigate = useNavigate();
  const [goalDays, setGoalDays] = useState(DEFAULT_CLIMB);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    setError(null);
    setIsSaving(true);
    try {
      await startClimb(goalDays);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not save your climb.',
      );
      setIsSaving(false);
    }
  }

  return (
    <section className="card welcome">
      <h2>Choose your first climb 🚴</h2>
      <p>
        Every day you complete your habits, your cyclist rides up the hill. How
        long should your first climb be? You can change it later in Profile.
      </p>

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
        {isSaving ? 'Starting…' : 'Start climbing'}
      </button>
    </section>
  );
}
