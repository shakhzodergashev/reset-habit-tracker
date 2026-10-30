import { Navigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { AuthForm, type AuthMode } from '../components/AuthForm';

/** The /login and /register pages. Already logged in? Go straight home. */
export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, isChecking } = useAuth();

  if (isChecking) {
    return <p className="status-message">Loading…</p>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <AuthForm mode={mode} />;
}
