import { b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { patterns: [], teams: [] };
  const cookie = request.headers.get("cookie") ?? "";
  const [patterns, teams] = await Promise.all([
    apiFetchData("/workweek-patterns", cookie),
    apiFetchData("/teams", cookie)
  ]);
  return {
    patterns: patterns ?? [],
    teams: teams ?? []
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DnLArheu.js')).default;
const server_id = "src/routes/admin/workweek-patterns/+page.server.ts";
const imports = ["_app/immutable/nodes/9.HS0RonUF.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js"];
const stylesheets = ["_app/immutable/assets/9.Dpsxwzoe.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-CV5lXSlI.js.map
