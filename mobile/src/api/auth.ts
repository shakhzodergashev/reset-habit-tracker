// Account calls, the same as on the website. Shapes match what the backend sends.
import { apiRequest, saveToken } from './client';

export interface User {
  id: string;
  email: string;
  timeZone: string;
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
  const { accessToken, user } = await apiRequest<AuthResponse>(
    '/auth/register',
    { method: 'POST', body: { email, password, timeZone: deviceTimeZone() } },
  );
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
