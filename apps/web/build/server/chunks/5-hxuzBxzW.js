import { f as fail } from './index-BkmUvga9.js';
import { a as apiFetch, b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { blackouts: [], locations: [], leaveTypes: [] };
  const cookie = request.headers.get("cookie") ?? "";
  const [blackouts, locations, leaveTypes] = await Promise.all([
    apiFetchData("/blackouts", cookie),
    apiFetchData("/locations", cookie),
    apiFetchData("/leave-types", cookie)
  ]);
  return {
    blackouts: blackouts ?? [],
    locations: locations ?? [],
    leaveTypes: leaveTypes ?? []
  };
};
const actions = {
  create: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const name = data.get("name")?.trim();
    const startDate = data.get("startDate");
    const endDate = data.get("endDate");
    const leaveTypeId = data.get("leaveTypeId") || null;
    const locationId = data.get("locationId") || null;
    if (!name || !startDate || !endDate) {
      return fail(400, { createError: { code: "VALIDATION", message: "Name, start date, and end date are required" } });
    }
    const idempotencyKey = `blackout-create-${locals.user.id}-${startDate}-${endDate}-${Date.now()}`;
    const result = await apiFetch("/blackouts", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        name,
        startDate,
        endDate,
        leaveTypeId: leaveTypeId || void 0,
        locationId: locationId || void 0
      })
    });
    if (result.error) {
      return fail(result.status || 400, { createError: result.error });
    }
    return { createSuccess: true };
  },
  delete: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { deleteError: { code: "VALIDATION", message: "id required" } });
    const result = await apiFetch(`/blackouts/${id}`, cookie, { method: "DELETE" });
    if (result.error) {
      return fail(result.status || 400, { deleteError: result.error });
    }
    return { deleteSuccess: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DTavNyWy.js')).default;
const server_id = "src/routes/admin/blackouts/+page.server.ts";
const imports = ["_app/immutable/nodes/5.BV_DSa2o.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BvXRaNk8.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/BguxzEhB.js"];
const stylesheets = ["_app/immutable/assets/ErrorBanner.C1OswYdo.css","_app/immutable/assets/5.DoeXT4zN.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=5-hxuzBxzW.js.map
