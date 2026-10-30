import { createContext, useContext } from 'react';
import type { User } from '../api/auth';

/** What every component can read from the "notice board" with useAuth(). */
export interface AuthContextValue {
  user: User | null; // null = nobody is logged in
  isChecking: boolean; // true while the saved token is being checked on page load
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// The notice board itself. AuthProvider fills it in.
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Read who is logged in, from any component inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
