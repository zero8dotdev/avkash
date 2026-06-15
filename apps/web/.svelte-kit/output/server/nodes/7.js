import * as server from '../entries/pages/admin/holidays/_page.server.ts.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/admin/holidays/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/admin/holidays/+page.server.ts";
export const imports = ["_app/immutable/nodes/7.BhXF1I03.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BYcAmK0v.js"];
export const stylesheets = ["_app/immutable/assets/7.D5A-VY0-.css"];
export const fonts = [];
