import { b as apiFetchData } from "../../../chunks/api.js";
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
export {
  load
};
