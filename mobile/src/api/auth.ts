// Account calls, the same as on the website. Shapes match what the backend sends.
import type { Accent } from '../accents';
import type { Climber } from '../journey/kid';
import { apiRequest, saveToken } from './client';

export interface User {
  id: string;
  email: string;
  timeZone: string;
  climber: Climber; // who climbs the hill
  accent: Accent; // the app colour
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

/** The phone's own time zone, e.g. "Asia/Tashkent". Sent when registering. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export async function register(email: string, password: string): Promise<User> {
  const { accessToken, user } = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, timeZone: deviceTimeZone() },
  });
  await saveToken(accessToken);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const { accessToken, user } = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  await saveToken(accessToken);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } finally {
    // Forget the token even if the server could not be reached.
    await saveToken(null);
  }
}

export function getMe(): Promise<User> {
  return apiRequest<User>('/me');
}

/** The settings that can be changed. Send only the ones that change. */
export interface UserSettings {
  timeZone?: string; // decides when your day starts and ends
  climber?: Climber;
  accent?: Accent;
}

export function updateMe(changes: UserSettings): Promise<User> {
  return apiRequest<User>('/me', { method: 'PATCH', body: changes });
}

/** Every time zone name the server accepts, sorted (for the picker). */
export function listTimeZones(): Promise<string[]> {
  return apiRequest<string[]>('/time-zones');
}

/** Changes the password. Other devices are logged out; this one stays logged in. */
export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiRequest<void>('/me/password', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  });
}

/** Deletes the account and everything in it, for good. */
export async function deleteAccount(password: string): Promise<void> {
  await apiRequest<void>('/me', { method: 'DELETE', body: { password } });
  await saveToken(null); // the login is gone with the account
}
