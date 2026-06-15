import { b as apiFetchData } from './api-BrE3GIFe.js';

const SARA_ID = "e208de76-cb76-4b2e-a562-318092def28f";
const load = async ({ locals, cookies }) => {
  const cookie = cookies.get("better-auth.session_token") ? `better-auth.session_token=${cookies.get("better-auth.session_token")}` : "";
  const [businessUnits, departments, teams, employees, leavePolicies, leaveTypes, transfersRaw, saraBalances] = await Promise.all([
    apiFetchData("/business-units", cookie),
    apiFetchData("/departments", cookie),
    apiFetchData("/teams", cookie),
    apiFetchData("/employees", cookie),
    apiFetchData("/leave-policies", cookie),
    apiFetchData("/leave-types", cookie),
    apiFetchData("/transfers", cookie),
    // Sara's CL balance for Ch8 — requires ADMIN/MANAGER or own user
    apiFetchData(`/balances/${SARA_ID}`, cookie)
  ]);
  const CL_LEAVE_TYPE_ID = "c9fcb140-5506-4535-bc82-4c92150e7ed7";
  const saraClBalance = saraBalances?.find((b) => b.leaveTypeId === CL_LEAVE_TYPE_ID)?.available ?? 7;
  return {
    user: locals.user,
    orgData: {
      org: { name: "Meridian Manufacturing Pvt. Ltd.", employeeCount: employees?.length ?? 0 },
      businessUnits: businessUnits ?? [],
      departments: departments ?? [],
      teams: teams ?? [],
      employees: employees ?? []
    },
    leavePolicies: leavePolicies ?? [],
    leaveTypes: leaveTypes ?? [],
    transferCount: transfersRaw?.length ?? 0,
    saraClBalance
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 13;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CSsOoUVR.js')).default;
const server_id = "src/routes/demo/+page.server.ts";
const imports = ["_app/immutable/nodes/13.YtRwtBmR.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
const stylesheets = ["_app/immutable/assets/13.DXH4BsZp.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=13-B9EI46sy.js.map
