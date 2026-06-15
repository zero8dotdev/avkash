import { fail } from "@sveltejs/kit";
import { a as apiFetch, b as apiFetchData } from "../../../chunks/api.js";
function thisWeekRange() {
  const now = /* @__PURE__ */ new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}
const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const tab = url.searchParams.get("tab") ?? "today";
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const week = thisWeekRange();
  const [weekAttendance, regularizations] = await Promise.all([
    apiFetchData(
      `/attendance/me?from=${week.from}&to=${week.to}`,
      cookie
    ),
    apiFetchData(
      "/attendance/regularizations",
      cookie
    )
  ]);
  const todayAttendance = (weekAttendance ?? []).find((d) => d.date === today) ?? null;
  let pendingRegQueue = [];
  if (user.role === "MANAGER" || user.role === "ADMIN") {
    const pending = await apiFetchData(
      "/attendance/regularizations?status=PENDING",
      cookie
    );
    pendingRegQueue = (pending ?? []).filter((r) => r.userId !== user.id);
  }
  return {
    user,
    tab,
    today,
    weekRange: week,
    weekAttendance: weekAttendance ?? [],
    todayAttendance,
    regularizations: regularizations ?? [],
    pendingRegQueue
  };
};
const actions = {
  // Check-in
  checkIn: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const result = await apiFetch("/attendance/check-in", cookie, {
      method: "POST",
      body: JSON.stringify({})
    });
    if (result.error) {
      return fail(result.status || 400, { punchError: result.error });
    }
    return { punchSuccess: true, punchType: "IN" };
  },
  // Check-out
  checkOut: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const result = await apiFetch("/attendance/check-out", cookie, {
      method: "POST",
      body: JSON.stringify({})
    });
    if (result.error) {
      return fail(result.status || 400, { punchError: result.error });
    }
    return { punchSuccess: true, punchType: "OUT" };
  },
  // Request regularization
  regularize: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const date = data.get("date");
    const requestedIn = data.get("requestedIn");
    const requestedOut = data.get("requestedOut");
    const reason = data.get("reason");
    if (!date || !reason) {
      return fail(400, { regError: { code: "VALIDATION", message: "Date and reason are required" } });
    }
    const toIST = (dateStr, timeStr) => {
      if (!timeStr) return null;
      return `${dateStr}T${timeStr}:00+05:30`;
    };
    const idempotencyKey = `reg-${locals.user.id}-${date}-${Date.now()}`;
    const result = await apiFetch("/attendance/regularizations", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        date,
        requestedIn: toIST(date, requestedIn),
        requestedOut: toIST(date, requestedOut),
        reason
      })
    });
    if (result.error) {
      return fail(result.status || 400, { regError: result.error });
    }
    return { regSuccess: true };
  },
  // Approve regularization
  approveReg: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const regId = data.get("regId");
    const note = data.get("note") || void 0;
    const result = await apiFetch(`/attendance/regularizations/${regId}/approve`, cookie, {
      method: "POST",
      body: JSON.stringify({ note })
    });
    if (result.error) {
      return fail(result.status || 400, { regDecisionError: result.error });
    }
    return { regDecisionSuccess: true, regAction: "approved" };
  },
  // Reject regularization
  rejectReg: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const regId = data.get("regId");
    const note = data.get("note") || void 0;
    const result = await apiFetch(`/attendance/regularizations/${regId}/reject`, cookie, {
      method: "POST",
      body: JSON.stringify({ note })
    });
    if (result.error) {
      return fail(result.status || 400, { regDecisionError: result.error });
    }
    return { regDecisionSuccess: true, regAction: "rejected" };
  }
};
export {
  actions,
  load
};
