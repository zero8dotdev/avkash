// Demo API endpoint — applies leave as Sara Khan (the demo persona).
// Used by Ch8Leave (blackout beat) and Ch9HalfDay (half-day + conflict beat).
// Sara's session is forwarded from the server cookie; callers pass the request body.
// This server-side proxy avoids CORS issues from the client calling localhost:3001.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

// Sara's CL type id (seeded)
const CL_LEAVE_TYPE_ID = 'c9fcb140-5506-4535-bc82-4c92150e7ed7';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json() as {
    startDate: string;
    endDate: string;
    duration?: string;
    halfDayPart?: string;
    reason?: string;
  };

  // Use the current session cookie (presenter must be signed in as Sara or any user).
  // The demo sign-in flow uses the session cookie from hooks.server.ts.
  const sessionCookie = cookies.get('better-auth.session_token');
  if (!sessionCookie) {
    return json({ error: { code: 'NOT_AUTHENTICATED', message: 'No session cookie' } }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `better-auth.session_token=${sessionCookie}`,
    },
    body: JSON.stringify({
      leaveTypeId: CL_LEAVE_TYPE_ID,
      startDate: body.startDate,
      endDate: body.endDate,
      duration: body.duration,
      halfDayPart: body.halfDayPart,
      reason: body.reason ?? 'Demo player test',
    }),
  });

  const data = await res.json() as unknown;
  return json(data, { status: res.status });
};
