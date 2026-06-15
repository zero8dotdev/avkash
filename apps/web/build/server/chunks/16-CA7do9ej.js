import { f as fail } from './index-BkmUvga9.js';
import { a as apiFetch, b as apiFetchData } from './api-BrE3GIFe.js';

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

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 16;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DeOFC5kO.js')).default;
const server_id = "src/routes/leave/+page.server.ts";
const imports = ["_app/immutable/nodes/16.VuMI9cSj.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BvXRaNk8.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/ObsDGmXM.js","_app/immutable/chunks/DxLrmQ3r.js","_app/immutable/chunks/CfUpXnJf.js"];
const stylesheets = ["_app/immutable/assets/ErrorBanner.C1OswYdo.css","_app/immutable/assets/StatusBadge.BXMm2-1m.css","_app/immutable/assets/16.Cb_1wys0.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=16-CA7do9ej.js.map
