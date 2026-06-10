import type { AuthContext } from './context';

// Relationship authorization contracts (Plan 51 Seam 4 — types only).
// The implementation (OpenFGA client, guards) lives in @avkash/authz (WS1); domain
// code consumes that package, never these raw shapes. Layered on TOP of the existing
// guards: requireRole/requireScope/assertOrg stay — every FGA-checked route still
// calls assertOrg (tenant isolation is never delegated to the graph alone).

/** An FGA relationship tuple: `user` holds `relation` on `object`.
 *  Refs are '<type>:<uuid>' — row UUIDs are globally unique, so cross-tenant
 *  collisions are impossible by construction. */
export interface TupleKey {
  user: string; // 'user:<uuid>'
  relation: string; // 'manager'
  object: string; // 'team:<uuid>'
}

/** A tuple with an optional FGA condition (e.g. delegation's active_window). */
export interface Tuple extends TupleKey {
  condition?: { name: string; context?: Record<string, unknown> };
}

/** The surface @avkash/authz implements. check/require/list FAIL CLOSED: FGA
 *  unreachable ⇒ UnavailableError('AUTHZ_UNAVAILABLE') (503) — never allow. */
export interface AuthzClient {
  /** True iff ctx.userId holds `relation` on `object`. */
  check(ctx: AuthContext, relation: string, object: string): Promise<boolean>;
  /** Throws ForbiddenError('FORBIDDEN_RELATION') when check() is false. */
  requireRelation(ctx: AuthContext, relation: string, object: string): Promise<void>;
  /** ListObjects → ids for SQL `WHERE id IN (...)` filtering on list endpoints. */
  listAccessible(ctx: AuthContext, relation: string, type: string): Promise<string[]>;
  /** Expand → the relation path ("why does Alice see this?") — the audit answer. */
  explainAccess(ctx: AuthContext, relation: string, object: string): Promise<unknown>;
  /** Used ONLY by the tuple-writer + reconciler (WS3) — never by route handlers. */
  writeTuples(writes: Tuple[], deletes?: TupleKey[]): Promise<void>;
}

// ── Core model vocabulary ─────────────────────────────────────────────────────
// Type + relation names of the core authorization model (WS2). Modules introduce
// their own types via the manifest's `authzModel` fragment.
export const FGA_TYPES = {
  user: 'user',
  org: 'org',
  businessUnit: 'business_unit',
  department: 'department',
  team: 'team',
  employee: 'employee',
  leaveRequest: 'leave_request',
} as const;

export type FgaType = (typeof FGA_TYPES)[keyof typeof FGA_TYPES];

/** The time-window condition delegations carry (WS2 defines it in the model DSL). */
export const ACTIVE_WINDOW_CONDITION = 'active_window';

export const objectRef = (type: FgaType | (string & {}), id: string): string => `${type}:${id}`;
export const userRef = (userId: string): string => `user:${userId}`;
