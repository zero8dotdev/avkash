// Demo API endpoint — cancels a leave application by ID.
// Used by Ch8Leave and Ch9HalfDay to clean up test leaves created during the demo.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json() as { leaveId: string };

  const sessionCookie = cookies.get('better-auth.session_token');
  if (!sessionCookie) {
    return json({ error: { code: 'NOT_AUTHENTICATED', message: 'No session cookie' } }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/leaves/${body.leaveId}`, {
    method: 'DELETE',
    headers: {
      Cookie: `better-auth.session_token=${sessionCookie}`,
    },
  });

  const data = await res.json() as unknown;
  return json(data, { status: res.status });
};
