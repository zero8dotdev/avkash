// Server-side API helper — forwards the browser session cookie to the Avkash API.
// Used in +page.server.ts load functions. The cookie forwarding mirrors hooks.server.ts.

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiResult<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

export async function apiFetch<T>(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        cookie,
        ...(init?.headers ?? {}),
      },
    });
    const body = await res.json() as { data?: T; error?: ApiError };
    return { ...(body as { data?: T; error?: ApiError }), status: res.status };
  } catch {
    return {
      error: { code: 'NETWORK_ERROR', message: 'Failed to reach the API' },
      status: 0,
    };
  }
}

// Unwraps data or returns null + error silently — use when missing data should
// gracefully degrade instead of throwing.
export async function apiFetchData<T>(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<T | null> {
  const result = await apiFetch<T>(path, cookie, init);
  return result.data ?? null;
}
