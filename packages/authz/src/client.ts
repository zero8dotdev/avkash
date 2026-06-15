// @avkash/authz — OpenFGA client implementation.
//
// Implements AuthzClient from @avkash/shared. All check / require / list methods
// FAIL CLOSED: an unreachable FGA service throws UnavailableError('AUTHZ_UNAVAILABLE')
// — never falls back to allow.
//
// CARDINAL RULE (mirrors packages/auth/src/guards.ts): never branch on ctx.via.
// Same enforcement regardless of transport (HTTP, Slack, API key, worker).

import { OpenFgaClient } from '@openfga/sdk';
import type { TupleKey as SdkTupleKey, TupleKeyWithoutCondition as SdkTupleKeyWithoutCondition } from '@openfga/sdk';
import { env } from '@avkash/config';
import {
  ForbiddenError,
  UnavailableError,
  type AuthContext,
  type AuthzClient,
  type Tuple,
  type TupleKey,
  userRef,
} from '@avkash/shared';

// ── Singleton client (lazy-initialised) ──────────────────────────────────────

let _client: OpenFgaClient | null = null;
let _storeId: string | null = null;

function getClient(): OpenFgaClient {
  if (!_client) {
    _client = new OpenFgaClient({
      apiUrl: env.FGA_API_URL,
      storeId: env.FGA_STORE_ID ?? '', // empty until ensureStore() runs at boot
    });
  }
  return _client;
}

/** Replace the singleton — used by ensureStore() after the store id is resolved. */
export function setStoreId(storeId: string): void {
  _storeId = storeId;
  _client = new OpenFgaClient({
    apiUrl: env.FGA_API_URL,
    storeId,
  });
}

/** The resolved store id (boot/ensureStore), or the env fallback. Consumers that
 *  build their own FGA clients (e.g. authz-sync's read path) MUST use this at
 *  call time instead of caching env.FGA_STORE_ID at construction. */
export function getStoreId(): string | null {
  return _storeId ?? env.FGA_STORE_ID ?? null;
}

// ── Fail-closed error mapper ──────────────────────────────────────────────────
// Transport errors (network, 5xx) → UnavailableError (503, FAIL CLOSED).
// Never swallow, never return false as a pass-through.

function mapFgaError(cause: unknown): never {
  throw new UnavailableError('AUTHZ_UNAVAILABLE', { cause: cause instanceof Error ? cause.message : String(cause) }, { cause });
}

// ── AuthzClient implementation ────────────────────────────────────────────────

/** True iff ctx.userId holds `relation` on `object`. FAIL CLOSED on FGA errors.
 *  Machine actors (userId === null) are denied — they must use scoped API keys. */
async function check(ctx: AuthContext, relation: string, object: string): Promise<boolean> {
  if (!ctx.userId) return false; // machine actors have no user-principal in the graph
  try {
    const res = await getClient().check({
      user: userRef(ctx.userId),
      relation,
      object,
    });
    return res.allowed ?? false;
  } catch (err) {
    return mapFgaError(err);
  }
}

/** Throws ForbiddenError('FORBIDDEN_RELATION') when check() returns false. */
async function requireRelation(ctx: AuthContext, relation: string, object: string): Promise<void> {
  const allowed = await check(ctx, relation, object);
  if (!allowed) {
    throw new ForbiddenError('FORBIDDEN_RELATION', { relation, object });
  }
}

/** ListObjects → bare ids (strips 'type:' prefix) for SQL WHERE id IN (...) filtering.
 *  Machine actors (userId === null) return empty list — they have no user-principal. */
async function listAccessible(ctx: AuthContext, relation: string, type: string): Promise<string[]> {
  if (!ctx.userId) return [];
  try {
    const res = await getClient().listObjects({
      user: userRef(ctx.userId),
      relation,
      type,
    });
    const prefix = `${type}:`;
    return (res.objects ?? []).map((o) => (o.startsWith(prefix) ? o.slice(prefix.length) : o));
  } catch (err) {
    return mapFgaError(err);
  }
}

/** Expand → the relation path ("why does Alice see this?") — the audit/compliance answer. */
async function explainAccess(ctx: AuthContext, relation: string, object: string): Promise<unknown> {
  try {
    const res = await getClient().expand({
      relation,
      object,
    });
    return res.tree;
  } catch (err) {
    return mapFgaError(err);
  }
}

/**
 * Write/delete tuples via the FGA Write API.
 *
 * IMPORTANT: This method is ONLY for the tuple-writer subscriber and nightly
 * reconciler. Route handlers must never call writeTuples directly —
 * tuple management is the exclusive domain of the sync pipeline.
 */
async function writeTuples(writes: Tuple[], deletes?: TupleKey[]): Promise<void> {
  const sdkWrites: SdkTupleKey[] = writes.map((t) => ({
    user: t.user,
    relation: t.relation,
    object: t.object,
    ...(t.condition ? { condition: { name: t.condition.name, context: t.condition.context } } : {}),
  }));

  const sdkDeletes: SdkTupleKeyWithoutCondition[] = (deletes ?? []).map((t) => ({
    user: t.user,
    relation: t.relation,
    object: t.object,
  }));

  try {
    await getClient().write({
      writes: sdkWrites.length > 0 ? sdkWrites : undefined,
      deletes: sdkDeletes.length > 0 ? sdkDeletes : undefined,
    });
  } catch (err) {
    return mapFgaError(err);
  }
}

export const authzClient: AuthzClient = {
  check,
  requireRelation,
  listAccessible,
  explainAccess,
  writeTuples,
};
