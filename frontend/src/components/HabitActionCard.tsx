import { useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import './HabitActionCard.css';

interface HabitActionCardProps {
  title: string; // "Archive habit"
  explanation: ReactNode; // what happens, in a sentence or two
  question: ReactNode; // "Archive Read 20 pages?"
  startLabel: string; // the first button, e.g. "Archive habit…"
  confirmLabel: string; // the red button, e.g. "Archive"
  busyLabel: string; // while it runs, e.g. "Archiving…"
  failMessage: string;
  isDanger?: boolean; // a red edge, for actions that can't be undone
  onConfirm: () => Promise<void>;
}

/**
 * A box on the Edit page for a big action (archive, delete), with a confirmation
 * step built into the page: first a button, then "are you sure?".
 */
export function HabitActionCard({
  title,
  explanation,
  question,
  startLabel,
  confirmLabel,
  busyLabel,
  failMessage,
  isDanger = false,
  onConfirm,
}: HabitActionCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsWorking(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : failMessage);
      setIsWorking(false);
    }
  }

  return (
    <section
      className={`card habit-action-card${isDanger ? ' is-danger' : ''}`}
    >
      <h3>{title}</h3>
      <p>{explanation}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/* Step 1: the button. Step 2: are you sure? */}
      {isConfirming ? (
        <div className="habit-action-confirm" role="group" aria-label={title}>
          <p>{question}</p>
          <div className="form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isWorking}
            >
              Keep habit
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isWorking}
            >
              {isWorking ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="form-actions">
          <button
            className={`button ${isDanger ? 'button-danger' : 'button-secondary'}`}
            type="button"
            onClick={() => setIsConfirming(true)}
          >
            {startLabel}
          </button>
        </div>
      )}
    </section>
  );
}
