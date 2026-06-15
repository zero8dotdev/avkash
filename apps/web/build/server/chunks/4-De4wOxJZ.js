import { r as redirect } from './index-BkmUvga9.js';

const load = async ({ parent }) => {
  const { notAuthorized } = await parent();
  if (!notAuthorized) {
    throw redirect(302, "/admin/leave-types");
  }
  return {};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DwxfaZr_.js')).default;
const server_id = "src/routes/admin/+page.server.ts";
const imports = ["_app/immutable/nodes/4.zPKMaNiO.js","_app/immutable/chunks/Bzak7iHL.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-De4wOxJZ.js.map
