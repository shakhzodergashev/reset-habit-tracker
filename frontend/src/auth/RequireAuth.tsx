import { Navigate, Outlet } from 'react-router';
import { useAuth } from './auth-context';

/**
 * Guards a group of pages: logged-in users see the page, everyone else is sent to /login.
 * <Outlet /> is where the matching child page (dashboard, new habit…) appears.
 * This is for a nice experience only. The real protection is the backend's AuthGuard.
 */
export function RequireAuth() {
  const { user, isChecking } = useAuth();

  if (isChecking) {
    return <p className="status-message">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
