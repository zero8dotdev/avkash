import { b as apiFetchData, a as apiFetch } from './api-BrE3GIFe.js';

const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const search = url.searchParams.get("search") ?? "";
  const teamFilter = url.searchParams.get("teamId") ?? "";
  const isManager = user.role === "MANAGER" || user.role === "ADMIN" || user.role === "OWNER";
  const [usersResult, teamsResult, locationsResult] = await Promise.all([
    apiFetchData("/users", cookie),
    apiFetchData("/teams", cookie),
    apiFetchData("/locations", cookie)
  ]);
  let fgaFilteredEmails = null;
  let fgaCount = 0;
  if (isManager) {
    const empResult = await apiFetch("/employees", cookie);
    if (empResult.data) {
      fgaFilteredEmails = new Set(empResult.data.map((e) => e.email ?? "").filter(Boolean));
      fgaCount = empResult.data.length;
    } else {
      fgaFilteredEmails = /* @__PURE__ */ new Set();
      fgaCount = 0;
    }
  }
  const allUsers = usersResult ?? [];
  const teams = teamsResult ?? [];
  const locations = locationsResult ?? [];
  let visibleUsers;
  if (!isManager) {
    visibleUsers = allUsers.filter((u) => u.id === user.id);
    fgaCount = visibleUsers.length;
  } else if (fgaFilteredEmails !== null) {
    visibleUsers = allUsers.filter((u) => fgaFilteredEmails.has(u.email));
  } else {
    visibleUsers = allUsers;
  }
  const lowerSearch = search.toLowerCase();
  let filtered = visibleUsers;
  if (lowerSearch) {
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(lowerSearch) || u.email.toLowerCase().includes(lowerSearch)
    );
  }
  if (teamFilter) {
    filtered = filtered.filter((u) => u.teamId === teamFilter);
  }
  return {
    user,
    employees: filtered,
    totalVisible: visibleUsers.length,
    fgaCount,
    teams,
    locations,
    search,
    teamFilter
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 14;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-lkCxYld0.js')).default;
const server_id = "src/routes/employees/+page.server.ts";
const imports = ["_app/immutable/nodes/14.DtxSbdLf.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/Dhug16JO.js"];
const stylesheets = ["_app/immutable/assets/14.Cjcjglua.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=14-DdxBhQwC.js.map
