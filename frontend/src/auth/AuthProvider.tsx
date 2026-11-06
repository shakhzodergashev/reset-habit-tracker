import { useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getToken, onSessionEnded, setToken } from '../api/client';
import { applyAccent } from '../theme';
import { AuthContext } from './auth-context';

/** Keeps track of who is logged in and shares it with every component inside it. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  // If a token was saved, we don't know yet whether it still works.
  const [isChecking, setIsChecking] = useState(() => getToken() !== null);
  // True when the backend refused our login while the app was open (expired / logged out elsewhere).
  const [sessionEnded, setSessionEnded] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

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

  // The site wears the account's colour; purple again after logging out.
  const accent = user?.accent;
  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  // Listen for "your session has ended" from apiRequest. RequireAuth then sends the user to /login.
  useEffect(() => {
    onSessionEnded(() => {
      setUser(null);
      setSessionEnded(true);
    });
    // Cleanup: stop listening if this provider ever goes away.
    return () => onSessionEnded(null);
  }, []);

  const value = {
    user,
    isChecking,
    sessionEnded,
    accountDeleted,
    login: async (email: string, password: string) => {
      setUser(await authApi.login(email, password));
      setSessionEnded(false);
      setAccountDeleted(false);
    },
    register: async (email: string, password: string) => {
      setUser(await authApi.register(email, password));
      setSessionEnded(false);
      setAccountDeleted(false);
    },
    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        // Server down or session already gone: the token is forgotten anyway.
      }
      setUser(null);
      setSessionEnded(false);
    },
    deleteAccount: async (password: string) => {
      await authApi.deleteAccount(password); // throws (and keeps you logged in) if the password is wrong
      setUser(null);
      setAccountDeleted(true);
    },
    updateMe: async (changes: authApi.UserSettings) => {
      setUser(await authApi.updateMe(changes)); // every page sees the change
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
