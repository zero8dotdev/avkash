import { j as json } from './index-BkmUvga9.js';

const API_BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3001";
const POST = async ({ request, cookies }) => {
  const body = await request.json();
  const sessionCookie = cookies.get("better-auth.session_token");
  if (!sessionCookie) {
    return json({ error: { code: "NOT_AUTHENTICATED", message: "No session cookie" } }, { status: 401 });
  }
  const res = await fetch(`${API_BASE}/leaves/${body.leaveId}`, {
    method: "DELETE",
    headers: {
      Cookie: `better-auth.session_token=${sessionCookie}`
    }
  });
  const data = await res.json();
  return json(data, { status: res.status });
};

export { POST };
//# sourceMappingURL=_server.ts-Bz4mNUlh.js.map
