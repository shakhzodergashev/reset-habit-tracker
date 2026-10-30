// One place for every call to the backend (the phone version of frontend/src/api/client.ts).
// Differences from the website:
// - there is no Vite proxy on a phone, so requests go straight to the backend's address;
// - the token is kept in the iPhone Keychain (expo-secure-store) instead of localStorage.
import * as SecureStore from 'expo-secure-store';

// Set in mobile/.env, e.g. http://192.168.86.250:3000 (EXPO_PUBLIC_ variables are built into the app).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const TOKEN_KEY = 'reset.accessToken';

// ---------- the login token ----------
// Kept in memory for every request, and saved in the Keychain so it survives closing the app.
let token: string | null = null;

/** Reads the saved token from the Keychain. Called once when the app starts. */
export async function loadToken(): Promise<string | null> {
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

export async function saveToken(value: string | null): Promise<void> {
  token = value;
  try {
    if (value) {
      await SecureStore.setItemAsync(TOKEN_KEY, value);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Keychain unavailable: the user stays logged in until the app is closed.
  }
}

// ---------- "your session has ended" ----------

let sessionEndedHandler: (() => void) | null = null;

export function onSessionEnded(handler: (() => void) | null): void {
  sessionEndedHandler = handler;
}

// ---------- errors ----------

/** A failed request, with the HTTP status and a message ready to show the user. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** NestJS errors look like { message: "..." } or, for validation, { message: ["...", "..."] }. */
function readErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) {
      return message.join('. ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return `Something went wrong (error ${status}). Please try again.`;
}

// ---------- the request function ----------

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/**
 * Calls the backend and returns the JSON answer as type T.
 * Example: const me = await apiRequest<User>('/me');
 * Throws ApiError if the backend answers with an error.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL is not set. See mobile/.env.example.');
  }

  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the server at ${API_URL}. Is the backend running, and is your phone on the same Wi-Fi?`,
    );
  }

  // 401 = the backend no longer accepts our login (expired, or logged out elsewhere).
  // The exception is the login request itself, where 401 means "wrong email or password".
  if (response.status === 401 && path !== '/auth/login') {
    await saveToken(null);
    sessionEndedHandler?.();
  }

  // 204 No Content (e.g. logout) has no body to read.
  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, readErrorMessage(body, response.status));
  }
  return body as T;
}
