import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './auth-context';

/**
 * Shows its children only to logged-in users; everyone else is sent to /login.
 * This is for a nice experience only. The real protection is the backend's AuthGuard.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isChecking } = useAuth();

  if (isChecking) {
    return <p className="status-message">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
