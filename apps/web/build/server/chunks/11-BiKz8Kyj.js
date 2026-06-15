import { f as fail } from './index-BkmUvga9.js';
import { a as apiFetch, b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const tab = url.searchParams.get("tab") ?? "my";
  const [myCompOffs, leaveTypes, balances] = await Promise.all([
    apiFetchData("/comp-off", cookie),
    apiFetchData("/leave-types", cookie),
    apiFetchData(`/balances/${user.id}`, cookie)
  ]);
  let pendingQueue = [];
  if (user.role === "MANAGER" || user.role === "ADMIN") {
    const all = await apiFetchData("/comp-off", cookie);
    pendingQueue = (all ?? []).filter((c) => c.status === "PENDING" && c.userId !== user.id);
  }
  const compOffType = (leaveTypes ?? []).find((lt) => lt.kind === "COMP_OFF") ?? null;
  const compOffBalance = compOffType ? (balances ?? []).find((b) => b.leaveTypeId === compOffType.leaveTypeId) ?? null : null;
  return {
    user,
    tab,
    myCompOffs: myCompOffs ?? [],
    leaveTypes: leaveTypes ?? [],
    compOffType,
    compOffBalance,
    pendingQueue
  };
};
const actions = {
  // Request a comp-off (earn)
  earn: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const workedOn = data.get("workedOn");
    const leaveTypeId = data.get("leaveTypeId");
    const days = parseFloat(data.get("days") || "1");
    if (!workedOn || !leaveTypeId) {
      return fail(400, { earnError: { code: "VALIDATION", message: "Worked date and leave type are required" } });
    }
    const idempotencyKey = `comp-off-earn-${locals.user.id}-${workedOn}-${Date.now()}`;
    const result = await apiFetch("/comp-off", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ workedOn, leaveTypeId, days })
    });
    if (result.error) {
      return fail(result.status || 400, { earnError: result.error });
    }
    return { earnSuccess: true };
  },
  // Approve a comp-off (MANAGER+)
  approve: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const compOffId = data.get("compOffId");
    if (!compOffId) {
      return fail(400, { decisionError: { code: "VALIDATION", message: "compOffId required" } });
    }
    const result = await apiFetch(`/comp-off/${compOffId}/approve`, cookie, {
      method: "POST",
      body: JSON.stringify({})
    });
    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: "approved", approved: result.data };
  },
  // Reject a comp-off (MANAGER+)
  reject: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const compOffId = data.get("compOffId");
    if (!compOffId) {
      return fail(400, { decisionError: { code: "VALIDATION", message: "compOffId required" } });
    }
    const result = await apiFetch(`/comp-off/${compOffId}/reject`, cookie, {
      method: "POST",
      body: JSON.stringify({})
    });
    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: "rejected" };
  },
  // Request encashment against EL balance
  requestEncashment: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const leaveTypeId = data.get("leaveTypeId");
    const days = parseFloat(data.get("days") || "0");
    if (!leaveTypeId || !days || days <= 0) {
      return fail(400, { encashError: { code: "VALIDATION", message: "Leave type and valid days are required" } });
    }
    const idempotencyKey = `encash-${locals.user.id}-${leaveTypeId}-${Date.now()}`;
    const result = await apiFetch("/encashments", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ leaveTypeId, days })
    });
    if (result.error) {
      return fail(result.status || 400, { encashError: result.error });
    }
    return { encashSuccess: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 11;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CvuAWZMw.js')).default;
const server_id = "src/routes/comp-off/+page.server.ts";
const imports = ["_app/immutable/nodes/11.CgbxBbMb.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BvXRaNk8.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/ObsDGmXM.js","_app/immutable/chunks/DxLrmQ3r.js","_app/immutable/chunks/CfUpXnJf.js"];
const stylesheets = ["_app/immutable/assets/ErrorBanner.C1OswYdo.css","_app/immutable/assets/StatusBadge.BXMm2-1m.css","_app/immutable/assets/11.Bv2Xtc8o.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=11-BiKz8Kyj.js.map
