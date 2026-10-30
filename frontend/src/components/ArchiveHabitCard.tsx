import { useState } from 'react';
import { ApiError } from '../api/client';
import './ArchiveHabitCard.css';

interface ArchiveHabitCardProps {
  habitName: string;
  onArchive: () => Promise<void>;
}

/** The "Archive habit" box on the Edit page, with a confirmation step built into the page. */
export function ArchiveHabitCard({ habitName, onArchive }: ArchiveHabitCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsArchiving(true);
    try {
      await onArchive();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not archive the habit. Please try again.',
      );
      setIsArchiving(false);
    }
  }

  return (
    <section className="card archive-card">
      <h3>Archive habit</h3>
      <p>
        It disappears from your dashboard, but its history is kept. You can
        restore it any time from “Archived habits”.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/* Step 1: the Archive button. Step 2: are you sure? */}
      {isConfirming ? (
        <div className="archive-confirm" role="group" aria-label="Confirm archiving">
          <p>
            Archive <strong>{habitName}</strong>?
          </p>
          <div className="form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setIsConfirming(false)}
              disabled={isArchiving}
            >
              Keep habit
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isArchiving}
            >
              {isArchiving ? 'Archiving…' : 'Archive'}
            </button>
          </div>
        </div>
      ) : (
        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setIsConfirming(true)}
          >
            Archive habit…
          </button>
        </div>
      )}
    </section>
  );
}
