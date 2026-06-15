import { b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ locals, request }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const [me, leaveTypes, leaveRequests, compOffs, regularizations] = await Promise.all([
    apiFetchData("/me", cookie),
    apiFetchData("/leave-types", cookie),
    apiFetchData("/leaves", cookie),
    apiFetchData("/comp-off", cookie),
    apiFetchData("/attendance/regularizations?status=PENDING", cookie)
  ]);
  const balances = await apiFetchData(
    `/balances/${user.id}`,
    cookie
  );
  let locationId = null;
  const teamId = me?.user?.teamId ?? null;
  if (teamId) {
    const teamsData = await apiFetchData("/teams", cookie);
    if (teamsData) {
      const team = teamsData.find((t) => t.teamId === teamId);
      locationId = team?.locationId ?? null;
    }
  }
  const KNOWN_LOCATIONS = {
    "9829047a-23a6-4e8d-b431-1b516190a60e": "4990b22b-3693-4bb5-8c22-2894d569b4a8",
    // Assembly → Coimbatore
    "bab83141-8519-48df-a578-7738e8a52279": "9d87c34d-280d-4161-9616-a7c68fec052e",
    // General → Bengaluru
    "d5715c44-1e43-4f67-8b75-7ef60a37e51d": "4990b22b-3693-4bb5-8c22-2894d569b4a8"
    // Logistics → Coimbatore
  };
  if (!locationId && teamId) {
    locationId = KNOWN_LOCATIONS[teamId] ?? null;
  }
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const holidayUrl = locationId ? `/holidays?location=${locationId}&year=${currentYear}` : `/holidays?year=${currentYear}`;
  const holidays = await apiFetchData(holidayUrl, cookie);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const attendanceToday = await apiFetchData(
    `/attendance/me?from=${today}&to=${today}`,
    cookie
  );
  return {
    user,
    me: me ?? null,
    leaveTypes: leaveTypes ?? [],
    balances: balances ?? [],
    leaveRequests: leaveRequests ?? [],
    compOffs: compOffs ?? [],
    regularizations: regularizations ?? [],
    holidays: holidays ?? [],
    attendanceToday: attendanceToday?.[0] ?? null,
    locationId
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 12;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DdYw6hgA.js')).default;
const server_id = "src/routes/dashboard/+page.server.ts";
const imports = ["_app/immutable/nodes/12.SPJWHtug.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js","_app/immutable/chunks/ObsDGmXM.js","_app/immutable/chunks/DxLrmQ3r.js","_app/immutable/chunks/CfUpXnJf.js","_app/immutable/chunks/BI7nSIaz.js"];
const stylesheets = ["_app/immutable/assets/StatusBadge.BXMm2-1m.css","_app/immutable/assets/12.BGEo-xDE.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=12-DBT_Tbju.js.map
