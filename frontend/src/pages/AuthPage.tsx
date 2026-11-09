import { Navigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { AuthForm, type AuthMode } from '../components/AuthForm';

/**
 * The /login and /register pages. Already logged in? Go straight home,
 * or, just after registering, to /welcome for a few first choices.
 */
export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, isChecking } = useAuth();

  if (isChecking) {
    return <p className="status-message">Loading…</p>;
  }
  if (user) {
    return <Navigate to={mode === 'register' ? '/welcome' : '/'} replace />;
  }
  return <AuthForm mode={mode} />;
}
