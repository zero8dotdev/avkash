import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { AuthContext } from '@avkash/shared';
import type { FieldGroupAccess, FieldGroupGrant, ResourceFieldGroups } from '@avkash/shared';

// ── In-memory cache ───────────────────────────────────────────────────────────
// Per (orgId, resource), short TTL. Only one resolution per key is in flight at
// a time — concurrent callers share the same Promise (stampede protection).

const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  rows: OrgRow[];
  expiresAt: number;
}

// Minimal representation of a field_policy row after fetch.
interface OrgRow {
  fieldGroup: string;
  relation: string;
  access: string;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<OrgRow[]>>();

function cacheKey(orgId: string, resource: string): string {
  return `${orgId}:${resource}`;
}

async function fetchRows(orgId: string, resource: string): Promise<OrgRow[]> {
  const key = cacheKey(orgId, resource);

  // Return cached if still fresh.
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  // Deduplicate concurrent fetches.
  let promise = inflight.get(key);
  if (!promise) {
    promise = db
      .select({
        fieldGroup: schema.fieldPolicy.fieldGroup,
        relation: schema.fieldPolicy.relation,
        access: schema.fieldPolicy.access,
      })
      .from(schema.fieldPolicy)
      .where(and(eq(schema.fieldPolicy.orgId, orgId), eq(schema.fieldPolicy.resource, resource)))
      .then((rows) => {
        cache.set(key, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
        inflight.delete(key);
        return rows;
      })
      .catch((err) => {
        inflight.delete(key);
        throw err;
      });
    inflight.set(key, promise);
  }
  return promise;
}

/** Invalidate the cache for a (orgId, resource) pair. Call after writes. */
export function invalidateFieldPolicy(orgId: string, resource: string): void {
  cache.delete(cacheKey(orgId, resource));
  // Also remove any in-flight promise so the next caller fetches fresh data.
  inflight.delete(cacheKey(orgId, resource));
}

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Resolve which field groups the caller may read and write for `resource`.
 *
 * Resolution order:
 *   1. Per-org override rows from `field_policy` (highest priority).
 *   2. Module-manifest defaults (`declared.defaults`).
 *
 * @param ctx       The caller's AuthContext — ctx.role is used as the relation
 *                  key when no explicit relations list is provided.
 * @param resource  The resource key, e.g. 'employee'.
 * @param declared  The ResourceFieldGroups manifest declaring defaults.
 * @param relations Optional explicit relation list (FGA-derived relations such as
 *                  manager, subject, etc.). Falls back to [ctx.role] when absent.
 */
export async function resolveFieldGroups(
  ctx: AuthContext,
  resource: string,
  declared: ResourceFieldGroups,
  relations?: readonly string[]
): Promise<FieldGroupGrant> {
  const effectiveRelations = relations?.length ? relations : [ctx.role as string];

  // Load org override rows (cached).
  const orgRows = await fetchRows(ctx.orgId, resource);

  // Build a lookup: (relation, fieldGroup) → access from org overrides.
  const overrideMap = new Map<string, FieldGroupAccess>();
  for (const row of orgRows) {
    overrideMap.set(`${row.relation}:${row.fieldGroup}`, row.access as FieldGroupAccess);
  }

  const readGroups = new Set<string>();
  const writeGroups = new Set<string>();

  const allGroups = Object.keys(declared.groups);

  for (const relation of effectiveRelations) {
    for (const group of allGroups) {
      const overrideKey = `${relation}:${group}`;
      // Org override row takes precedence over manifest default.
      const access: FieldGroupAccess = overrideMap.get(overrideKey) ?? declared.defaults[relation]?.[group] ?? 'none';

      if (access === 'write') {
        writeGroups.add(group);
        readGroups.add(group); // 'write' implies 'read'
      } else if (access === 'read') {
        readGroups.add(group);
      }
      // 'none' → neither set
    }
  }

  return {
    resource,
    read: readGroups,
    write: writeGroups,
  };
}
