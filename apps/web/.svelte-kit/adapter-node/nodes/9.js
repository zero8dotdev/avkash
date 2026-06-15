import * as server from '../entries/pages/admin/workweek-patterns/_page.server.ts.js';

export const index = 9;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/admin/workweek-patterns/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/admin/workweek-patterns/+page.server.ts";
export const imports = ["_app/immutable/nodes/9.HS0RonUF.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js"];
export const stylesheets = ["_app/immutable/assets/9.Dpsxwzoe.css"];
export const fonts = [];
