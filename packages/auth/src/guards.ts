import { type AuthContext, type Role, hasRank, ForbiddenError } from '@avkash/shared'

// ── Authz guards (centered, transport-blind) ─────────────────────────────────
// These read only the principal + the operation. They NEVER branch on ctx.via —
// that is the cardinal rule (see docs/lessons/auth.md). Same enforcement no
// matter which door the request came through.

/** Role-based access. OWNER > ADMIN > MANAGER > USER > ANON. */
export function requireRole(ctx: AuthContext, min: Role): void {
  if (!hasRank(ctx.role, min)) throw new ForbiddenError(`Requires ${min}`)
}

/** Credential scope (API keys / OAuth tokens). Delegation: a key may carry less than its owner. */
export function requireScope(ctx: AuthContext, scope: string): void {
  if (ctx.scopes && !ctx.scopes.includes(scope)) throw new ForbiddenError(`Missing scope ${scope}`)
}

/** Identity-assurance gate for sensitive actions. Low-assurance ctx → step-up, not bypass. */
export function requireAssurance(ctx: AuthContext, level: 'high'): void {
  if (ctx.assurance !== level) throw new ForbiddenError('Step-up authentication required')
}

/** Tenant isolation — the RLS replacement. Asserts a resource's org matches the caller's. */
export function assertOrg(ctx: AuthContext, resourceOrgId: string): void {
  if (ctx.orgId !== resourceOrgId) throw new ForbiddenError('Cross-org access denied')
}
