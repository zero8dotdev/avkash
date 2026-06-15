import { fail } from "@sveltejs/kit";
import { a as apiFetch, b as apiFetchData } from "../../../chunks/api.js";
const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const tab = url.searchParams.get("tab") ?? "my";
  const [leaveTypes, myLeaves, balances] = await Promise.all([
    apiFetchData("/leave-types", cookie),
    apiFetchData("/leaves", cookie),
    apiFetchData(`/balances/${user.id}`, cookie)
  ]);
  let pendingApprovals = [];
  if (user.role === "MANAGER" || user.role === "ADMIN") {
    const pending = await apiFetchData(
      "/leaves?status=PENDING",
      cookie
    );
    pendingApprovals = (pending ?? []).filter((l) => l.userId !== user.id);
  }
  return {
    user,
    leaveTypes: leaveTypes ?? [],
    myLeaves: myLeaves ?? [],
    balances: balances ?? [],
    pendingApprovals,
    tab
  };
};
const actions = {
  // Apply for leave
  apply: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const leaveTypeId = data.get("leaveTypeId");
    const startDate = data.get("startDate");
    const endDate = data.get("endDate");
    const duration = data.get("duration") || "FULL_DAY";
    const halfDayPart = data.get("halfDayPart") || "NONE";
    const reason = data.get("reason") || void 0;
    if (!leaveTypeId || !startDate || !endDate) {
      return fail(400, { applyError: { code: "VALIDATION", message: "Required fields missing" } });
    }
    const idempotencyKey = `leave-apply-${locals.user.id}-${startDate}-${endDate}-${Date.now()}`;
    const result = await apiFetch("/leaves", cookie, {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        leaveTypeId,
        startDate,
        endDate,
        duration,
        halfDayPart: halfDayPart === "NONE" ? void 0 : halfDayPart,
        reason
      })
    });
    if (result.error) {
      return fail(result.status || 400, { applyError: result.error });
    }
    return { applySuccess: true, applied: result.data };
  },
  // Approve a leave
  approve: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const leaveId = data.get("leaveId");
    const comment = data.get("comment") || void 0;
    if (!leaveId) {
      return fail(400, { decisionError: { code: "VALIDATION", message: "leaveId required" } });
    }
    const result = await apiFetch(`/leaves/${leaveId}/approve`, cookie, {
      method: "POST",
      body: JSON.stringify({ comment })
    });
    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: "approved" };
  },
  // Reject a leave
  reject: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const leaveId = data.get("leaveId");
    const comment = data.get("comment") || void 0;
    if (!leaveId) {
      return fail(400, { decisionError: { code: "VALIDATION", message: "leaveId required" } });
    }
    const result = await apiFetch(`/leaves/${leaveId}/reject`, cookie, {
      method: "POST",
      body: JSON.stringify({ comment })
    });
    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: "rejected" };
  }
};
export {
  actions,
  load
};
