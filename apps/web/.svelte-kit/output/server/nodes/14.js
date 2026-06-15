import * as server from '../entries/pages/employees/_page.server.ts.js';

export const index = 14;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/employees/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/employees/+page.server.ts";
export const imports = ["_app/immutable/nodes/14.DtxSbdLf.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/Dhug16JO.js"];
export const stylesheets = ["_app/immutable/assets/14.Cjcjglua.css"];
export const fonts = [];
