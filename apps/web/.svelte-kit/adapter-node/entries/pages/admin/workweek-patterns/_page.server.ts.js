import { b as apiFetchData } from "../../../../chunks/api.js";
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
export {
  load
};
