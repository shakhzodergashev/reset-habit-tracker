import { useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getToken, setToken } from '../api/client';
import { AuthContext } from './auth-context';

/** Keeps track of who is logged in and shares it with every component inside it. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  // If a token was saved, we don't know yet whether it still works.
  const [isChecking, setIsChecking] = useState(() => getToken() !== null);

  // Runs once, after the app first appears: check the saved token with GET /me.
  useEffect(() => {
    if (getToken() === null) {
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => setToken(null)) // expired or logged out: forget it
      .finally(() => setIsChecking(false));
  }, []); // [] = run only once, not on every redraw

  const value = {
    user,
    isChecking,
    login: async (email: string, password: string) => {
      setUser(await authApi.login(email, password));
    },
    register: async (email: string, password: string) => {
      setUser(await authApi.register(email, password));
    },
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
