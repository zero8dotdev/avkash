import { r as redirect } from './index-BkmUvga9.js';

const PUBLIC_ROUTES = ["/login"];
const API_BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3001";
const handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  if (PUBLIC_ROUTES.some((p) => path.startsWith(p))) {
    return resolve(event);
  }
  const cookie = event.request.headers.get("cookie") ?? "";
  let user = null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/get-session`, {
      headers: { cookie }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        user = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role ?? "USER",
          orgId: data.user.orgId ?? null
        };
      }
    }
  } catch {
  }
  event.locals.user = user;
  if (!user) {
    throw redirect(302, `/login?next=${encodeURIComponent(path)}`);
  }
  return resolve(event);
};

export { handle };
//# sourceMappingURL=hooks.server-CKPb8xx2.js.map
