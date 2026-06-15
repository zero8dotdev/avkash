import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.C7WVhzWJ.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/sYZ2FWEN.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/CfUpXnJf.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/dD7Wm9oR.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/BrwyxlU3.js"];
export const stylesheets = ["_app/immutable/assets/0.BCK9Bc2y.css"];
export const fonts = [];
