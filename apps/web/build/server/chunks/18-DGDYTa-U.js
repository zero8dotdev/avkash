import { b as apiFetchData, a as apiFetch } from './api-BrE3GIFe.js';
import { r as redirect } from './index-BkmUvga9.js';

function todayISO() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function monthStartISO() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const isManager = user.role === "MANAGER" || user.role === "ADMIN" || user.role === "OWNER";
  if (!isManager) {
    throw redirect(302, "/dashboard");
  }
  const report = url.searchParams.get("report") ?? "balance";
  const teamId = url.searchParams.get("teamId") ?? "";
  const year = url.searchParams.get("year") ?? String((/* @__PURE__ */ new Date()).getFullYear());
  const fromDate = url.searchParams.get("from") ?? monthStartISO();
  const toDate = url.searchParams.get("to") ?? todayISO();
  const [teamsResult, leaveTypesResult] = await Promise.all([
    apiFetchData("/teams", cookie),
    apiFetchData("/leave-types", cookie)
  ]);
  const teams = teamsResult ?? [];
  const leaveTypes = leaveTypesResult ?? [];
  let balanceReport = [];
  let utilizationReport = [];
  let musterReport = [];
  let musterError = null;
  if (report === "balance") {
    const path = teamId ? `/reports/leave-balance?teamId=${teamId}` : "/reports/leave-balance";
    balanceReport = await apiFetchData(path, cookie) ?? [];
  } else if (report === "utilization") {
    let path = `/reports/leave-utilization?year=${year}`;
    if (teamId) path += `&teamId=${teamId}`;
    utilizationReport = await apiFetchData(path, cookie) ?? [];
  } else if (report === "muster") {
    if (!teamId) {
      musterError = "Select a team to view the muster report.";
    } else {
      const path = `/reports/muster?teamId=${teamId}&from=${fromDate}&to=${toDate}`;
      const result = await apiFetch(path, cookie);
      if (result.error) {
        musterError = result.error.message ?? "Failed to load muster";
      } else {
        musterReport = result.data ?? [];
      }
    }
  }
  return {
    user,
    report,
    teamId,
    year,
    fromDate,
    toDate,
    teams,
    leaveTypes,
    balanceReport,
    utilizationReport,
    musterReport,
    musterError
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 18;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-B54DCTbB.js')).default;
const server_id = "src/routes/reports/+page.server.ts";
const imports = ["_app/immutable/nodes/18.DCaldey6.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
const stylesheets = ["_app/immutable/assets/18.CsGJI4o3.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=18-DGDYTa-U.js.map
