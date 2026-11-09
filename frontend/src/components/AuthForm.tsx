import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import './AuthForm.css';

export type AuthMode = 'login' | 'register';

/** One form for both logging in and registering, depending on `mode`. */
export function AuthForm({ mode }: { mode: AuthMode }) {
  const auth = useAuth(); // read login/register from the notice board
  const navigate = useNavigate(); // lets code move to another page

  // State: values React remembers between redraws. Changing them redraws the form.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this, the browser would reload the page (the old-fashioned way to send a form).
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await auth.register(email, password);
      } else {
        await auth.login(email, password);
      }
      // New account: the Welcome page first. Logged in: go to the home page.
      navigate(isRegister ? '/welcome' : '/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card auth-form" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>

      {!isRegister && auth.sessionEnded && (
        <p className="form-notice" role="status">
          Your session has ended. Please log in again.
        </p>
      )}
      {auth.accountDeleted && (
        <p className="form-notice" role="status">
          Your account and all its data have been deleted.
        </p>
      )}

      <label className="field">
        <span>Email</span>
        {/* A "controlled" input: its value comes from state, and typing updates the state. */}
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          minLength={isRegister ? 8 : undefined}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {isRegister && <small>At least 8 characters.</small>}
      </label>

      {/* Only shown when there is an error. */}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="button button-primary"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? 'Please wait…'
          : isRegister
            ? 'Create account'
            : 'Log in'}
      </button>

      <p className="auth-switch">
        {isRegister ? 'Already have an account? ' : 'New to RESET? '}
        {/* <Link> changes the page without reloading the browser. */}
        <Link to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
