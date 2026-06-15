import * as server from '../entries/pages/employees/_id_/_page.server.ts.js';

export const index = 15;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/employees/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/employees/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/15.50cBSolA.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BvXRaNk8.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
export const stylesheets = ["_app/immutable/assets/ErrorBanner.C1OswYdo.css","_app/immutable/assets/15.DtnUZw-d.css"];
export const fonts = [];
