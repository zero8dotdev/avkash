// @avkash/auth — Layer 1 identity. Where authN (per-transport resolvers) meets
// authz (centered guards). The AuthContext seam lives in @avkash/shared.
export { auth } from './auth';
export type { Auth, Session } from './auth';
export * from './context'; // getAuthContext (authN resolver)
export * from './guards'; // requireRole, requireScope, requireAssurance, assertOrg (authz)
