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
  etag?: string;
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
    const body = await res.json() as unknown;
    // Capture ETag for optimistic-concurrency (PATCH If-Match) flows.
    const etag = res.headers.get('etag') ?? undefined;

    // Handle both envelope responses { data: T } and direct object responses (e.g. /users/:id).
    if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
      const b = body as Record<string, unknown>;
      if ('error' in b) {
        return { error: b.error as ApiError, status: res.status, etag };
      }
      if ('data' in b) {
        return { data: b.data as T, status: res.status, etag };
      }
      // No wrapper: the response IS the data (e.g. /users/:id).
      return { data: body as T, status: res.status, etag };
    }
    // Array or primitive — treat as unwrapped data.
    return { data: body as T, status: res.status, etag };
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
