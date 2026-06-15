import * as server from '../entries/pages/reports/_page.server.ts.js';

export const index = 18;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/reports/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/reports/+page.server.ts";
export const imports = ["_app/immutable/nodes/18.DCaldey6.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
export const stylesheets = ["_app/immutable/assets/18.CsGJI4o3.css"];
export const fonts = [];
