import { json } from "@sveltejs/kit";
const API_BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3001";
const CL_LEAVE_TYPE_ID = "c9fcb140-5506-4535-bc82-4c92150e7ed7";
const POST = async ({ request, cookies }) => {
  const body = await request.json();
  const sessionCookie = cookies.get("better-auth.session_token");
  if (!sessionCookie) {
    return json({ error: { code: "NOT_AUTHENTICATED", message: "No session cookie" } }, { status: 401 });
  }
  const res = await fetch(`${API_BASE}/leaves`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `better-auth.session_token=${sessionCookie}`
    },
    body: JSON.stringify({
      leaveTypeId: CL_LEAVE_TYPE_ID,
      startDate: body.startDate,
      endDate: body.endDate,
      duration: body.duration,
      halfDayPart: body.halfDayPart,
      reason: body.reason ?? "Demo player test"
    })
  });
  const data = await res.json();
  return json(data, { status: res.status });
};
export {
  POST
};
