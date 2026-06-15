import { r as redirect } from './index-BkmUvga9.js';

const load = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, "/dashboard");
  }
  return {};
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 17;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DBhf8I4B.js')).default;
const server_id = "src/routes/login/+page.server.ts";
const imports = ["_app/immutable/nodes/17.DmWv0t94.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/CfUpXnJf.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BrwyxlU3.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/dD7Wm9oR.js"];
const stylesheets = ["_app/immutable/assets/17.BwXdSpTx.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=17-D8RfjUAx.js.map
