import { b as apiFetchData } from "../../../../chunks/api.js";
const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { allHolidays: [], locations: [], locationHolidays: {} };
  const cookie = request.headers.get("cookie") ?? "";
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const [locations, allHolidays] = await Promise.all([
    apiFetchData("/locations", cookie),
    apiFetchData(`/holidays?year=${year}`, cookie)
  ]);
  const locationList = locations ?? [];
  const allH = allHolidays ?? [];
  const locationHolidayMap = {};
  await Promise.all(
    locationList.map(async (loc) => {
      const locHolidays = await apiFetchData(
        `/holidays?location=${loc.id}&year=${year}`,
        cookie
      );
      locationHolidayMap[loc.id] = locHolidays ?? [];
    })
  );
  return {
    allHolidays: allH,
    locations: locationList,
    locationHolidays: locationHolidayMap,
    year
  };
};
export {
  load
};
