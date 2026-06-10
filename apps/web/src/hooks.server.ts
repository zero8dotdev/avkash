import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/login'];
const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

// Guard: check session against the API's Better Auth endpoint and populate
// event.locals.user. Unauthenticated requests to protected routes are redirected
// to /login. The session cookie is forwarded as-is from the browser request.
export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Skip auth check for public routes.
  if (PUBLIC_ROUTES.some((p) => path.startsWith(p))) {
    return resolve(event);
  }

  // Forward the browser's cookie header so Better Auth can validate the session.
  const cookie = event.request.headers.get('cookie') ?? '';

  let user: App.Locals['user'] = null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/get-session`, {
      headers: { cookie },
    });

    if (res.ok) {
      const data = (await res.json()) as {
        user?: {
          id: string;
          name: string;
          email: string;
          role?: string;
          orgId?: string;
        };
      };
      if (data?.user) {
        user = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role ?? 'USER',
          orgId: data.user.orgId ?? null,
        };
      }
    }
  } catch {
    // API unreachable — treat as unauthenticated, let the app render the error state.
  }

  event.locals.user = user;

  if (!user) {
    throw redirect(302, `/login?next=${encodeURIComponent(path)}`);
  }

  return resolve(event);
};
