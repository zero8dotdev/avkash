import * as server from '../entries/pages/dashboard/_page.server.ts.js';

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+page.server.ts";
export const imports = ["_app/immutable/nodes/12.SPJWHtug.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/84zgOHFZ.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js","_app/immutable/chunks/ObsDGmXM.js","_app/immutable/chunks/DxLrmQ3r.js","_app/immutable/chunks/CfUpXnJf.js","_app/immutable/chunks/BI7nSIaz.js"];
export const stylesheets = ["_app/immutable/assets/StatusBadge.BXMm2-1m.css","_app/immutable/assets/12.BGEo-xDE.css"];
export const fonts = [];
