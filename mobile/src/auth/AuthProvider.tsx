import { useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { loadToken, onSessionEnded, saveToken } from '../api/client';
import { AuthContext } from './auth-context';

/** Keeps track of who is logged in and shares it with every screen. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  // On a phone the token is read from the Keychain asynchronously, so we always start "checking".
  const [isChecking, setIsChecking] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

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
    login: async (email: string, password: string) => {
      setUser(await authApi.login(email, password));
      setSessionEnded(false);
    },
    register: async (email: string, password: string) => {
      setUser(await authApi.register(email, password));
      setSessionEnded(false);
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
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
