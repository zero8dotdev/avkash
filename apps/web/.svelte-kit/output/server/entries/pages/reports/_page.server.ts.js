import { b as apiFetchData, a as apiFetch } from "../../../chunks/api.js";
import { redirect } from "@sveltejs/kit";
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
export {
  load
};
