import { b as apiFetchData } from './api-BrE3GIFe.js';

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

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DTpy6hWK.js')).default;
const server_id = "src/routes/admin/holidays/+page.server.ts";
const imports = ["_app/immutable/nodes/7.BhXF1I03.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BYcAmK0v.js"];
const stylesheets = ["_app/immutable/assets/7.D5A-VY0-.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-DkEa2F2C.js.map
