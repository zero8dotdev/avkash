export { db, ping } from './client';
export type { DB } from './client';
// All tables/enums/relations under the `schema` namespace (db.* queries use this)...
export * as schema from './schema';
// ...and the inferred row types at top level (User, Leave, NewLeave, …) for ergonomics.
export * from './schema/types';
