// The account calls, built on apiRequest. Shapes match what the backend sends.
import type { Climber } from '../journey/kid';
import { apiRequest, setToken } from './client';

export interface User {
  id: string;
  email: string;
  timeZone: string;
  climber: Climber; // who climbs the hill
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

/** The browser's own time zone, e.g. "Asia/Tashkent". Sent when registering. */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function register(email: string, password: string): Promise<User> {
  const { accessToken, user } = await apiRequest<AuthResponse>(
    '/auth/register',
    { method: 'POST', body: { email, password, timeZone: browserTimeZone() } },
  );
  setToken(accessToken);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const { accessToken, user } = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setToken(accessToken);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } finally {
    // Forget the token even if the server could not be reached.
    setToken(null);
  }
}

export function getMe(): Promise<User> {
  return apiRequest<User>('/me');
}

/** The settings that can be changed. Send only the ones that change. */
export interface UserSettings {
  timeZone?: string; // decides when your day starts and ends
  climber?: Climber;
}

export function updateMe(changes: UserSettings): Promise<User> {
  return apiRequest<User>('/me', { method: 'PATCH', body: changes });
}

/** Every time zone name the server accepts, sorted (for the picker). */
export function listTimeZones(): Promise<string[]> {
  return apiRequest<string[]>('/time-zones');
}

/** Changes the password. Other devices are logged out; this one stays logged in. */
export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return apiRequest<void>('/me/password', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  });
}

/** Deletes the account and everything in it, for good. */
export async function deleteAccount(password: string): Promise<void> {
  await apiRequest<void>('/me', { method: 'DELETE', body: { password } });
  setToken(null); // the login is gone with the account
}
