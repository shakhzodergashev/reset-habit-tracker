import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import './AccountCards.css';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** "Change password": closed at first; opens into a small form. */
export function ChangePasswordCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function close() {
    setIsOpen(false);
    setCurrent('');
    setNext('');
    setRepeat('');
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    // Typing it twice catches a typo before it locks you out.
    if (next !== repeat) {
      setError('The two new passwords are not the same.');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(current, next);
      close();
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, 'Could not change the password.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card account-card">
      <h3>Password</h3>
      {done && !isOpen && (
        <p className="form-notice" role="status">
          Password changed. Your other devices have been logged out.
        </p>
      )}

      {!isOpen ? (
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setIsOpen(true);
            setDone(false);
          }}
        >
          Change password
        </button>
      ) : (
        <form className="account-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>
          <label className="field">
            <span>
              New password <small>(at least 8 characters)</small>
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </label>
          <label className="field">
            <span>New password again</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={close}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Change password'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/**
 * "Delete account": step 1 is a button, step 2 explains what happens and asks
 * for the password. Only then is everything deleted, for good.
 */
export function DeleteAccountCard() {
  const { deleteAccount } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsDeleting(true);
    try {
      // On success you are logged out and taken to the login page.
      await deleteAccount(password);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the account.'));
      setIsDeleting(false);
    }
  }

  return (
    <section className="card account-card is-danger">
      <h3>Delete account</h3>
      <p>
        This deletes your account and everything in it: habits, ticks, climbs
        and streaks. It can't be undone.
      </p>

      {!isConfirming ? (
        <button
          className="button button-danger"
          type="button"
          onClick={() => setIsConfirming(true)}
        >
          Delete account…
        </button>
      ) : (
        <form className="account-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Type your password to confirm</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setPassword('');
                setError(null);
              }}
              disabled={isDeleting}
            >
              Keep my account
            </button>
            <button
              className="button button-danger"
              type="submit"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
