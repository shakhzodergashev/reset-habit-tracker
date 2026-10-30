// One place for every call to the backend.
// Requests go to /api/..., which Vite forwards to NestJS (see vite.config.ts).

const TOKEN_KEY = 'reset.accessToken';

// ---------- the login token ----------
// Kept in localStorage so a page refresh doesn't log you out.
// (Some browsers block storage, e.g. in private mode, hence the try/catch.)

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage blocked: the user stays logged in until the page is refreshed.
  }
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
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // fetch itself only fails when the server can't be reached at all.
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
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
