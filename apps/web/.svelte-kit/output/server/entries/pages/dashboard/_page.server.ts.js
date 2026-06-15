import { b as apiFetchData } from "../../../chunks/api.js";
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
export {
  load
};
