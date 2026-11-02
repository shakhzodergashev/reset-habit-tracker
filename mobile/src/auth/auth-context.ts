import { createContext, useContext } from 'react';
import type { User } from '../api/auth';

/** What every screen can read with useAuth(), the same idea as on the website. */
export interface AuthContextValue {
  user: User | null; // null = nobody is logged in
  isChecking: boolean; // true while the saved token is being checked at start-up
  sessionEnded: boolean; // true if the backend ended the login while the app was open
  accountDeleted: boolean; // true right after the user deleted their account
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
