import { b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { leaveTypes: [], policies: [], teams: [] };
  const cookie = request.headers.get("cookie") ?? "";
  const [leaveTypes, policies, teams] = await Promise.all([
    apiFetchData("/leave-types", cookie),
    apiFetchData("/leave-policies", cookie),
    apiFetchData("/teams", cookie)
  ]);
  return {
    leaveTypes: leaveTypes ?? [],
    policies: policies ?? [],
    teams: teams ?? []
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-m63NgxFV.js')).default;
const server_id = "src/routes/admin/leave-types/+page.server.ts";
const imports = ["_app/immutable/nodes/8.PlhJGMCn.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
const stylesheets = ["_app/immutable/assets/8.BvBAvkt3.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=8-BnzcWV9z.js.map
