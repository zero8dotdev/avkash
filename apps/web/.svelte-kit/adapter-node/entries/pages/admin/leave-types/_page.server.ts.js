import { b as apiFetchData } from "../../../../chunks/api.js";
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
export {
  load
};
