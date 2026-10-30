import { useState, type FormEvent } from 'react';
import { login, register, type User } from '../api/auth';
import { ApiError } from '../api/client';
import './AuthForm.css';

export type AuthMode = 'login' | 'register';

// Props = the inputs this component receives from its parent.
interface AuthFormProps {
  mode: AuthMode;
  onSuccess: (user: User) => void; // called with the user after a successful login/register
  onSwitchMode: () => void; // called when "Create an account" / "Log in" is clicked
}

/** One form for both logging in and registering, depending on `mode`. */
export function AuthForm({ mode, onSuccess, onSwitchMode }: AuthFormProps) {
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
      const user = isRegister
        ? await register(email, password)
        : await login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card auth-form" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>

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

      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
      </button>

      <p className="auth-switch">
        {isRegister ? 'Already have an account?' : 'New to RESET?'}{' '}
        <button className="button-link" type="button" onClick={onSwitchMode}>
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}
