import { useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { loadToken, onSessionEnded, saveToken } from '../api/client';
import { setAccent } from '../theme';
import { AuthContext } from './auth-context';

/** Keeps track of who is logged in and shares it with every screen. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  // On a phone the token is read from the Keychain asynchronously, so we always start "checking".
  const [isChecking, setIsChecking] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  // When the app starts: read the saved token, then ask the backend who it belongs to.
  useEffect(() => {
    loadToken()
      .then(async (token) => {
        if (token) {
          setUser(await authApi.getMe());
        }
      })
      .catch(() => saveToken(null)) // expired, logged out, or server unreachable: start fresh
      .finally(() => setIsChecking(false));
  }, []);

  // The app wears the account's colour; purple again after logging out.
  const accent = user?.accent;
  useEffect(() => {
    setAccent(accent);
  }, [accent]);

  // Listen for "your session has ended" from apiRequest.
  useEffect(() => {
    onSessionEnded(() => {
      setUser(null);
      setSessionEnded(true);
    });
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
        // Server unreachable or session already gone: the token is forgotten anyway.
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
      setUser(await authApi.updateMe(changes)); // every screen sees the change
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
