// State-based tuple writer (Plan 51 Rule 1).
//
// syncOrgTuples(orgId):
//   1. deriveExpectedTuples(orgId)   → what SHOULD be in FGA
//   2. readAllFgaTuples()            → what IS in FGA
//   3. diff                          → missing = writes, extra = deletes
//   4. authzClient.writeTuples(missing, extra)
//
// IDEMPOTENT BY CONSTRUCTION: this function does not depend on event ordering.
// Calling it twice (e.g. from two concurrent relay deliveries) produces the
// same final FGA state because both passes derive from the same Postgres
// snapshot. At-least-once delivery is safe.
//
// Why state-based and not delta-based?
//   Delta-based writers are simple until they're not: replay, reorder, missed
//   events, concurrent updates, and backfills all produce subtle incorrect
//   state. State-based means FGA always converges to the Postgres truth
//   regardless of how many times or in what order events arrive.

import { eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { authzClient } from '@avkash/authz';
import type { Tuple, TupleKey } from '@avkash/shared';
import { deriveExpectedTuples } from './derive';
import { readAllFgaTuples, tupleKeyStr } from './fga-read';

// ── Diff helpers ──────────────────────────────────────────────────────────────

/**
 * Given expected and actual tuple lists, compute:
 *   - toWrite:  expected tuples absent from actual (need to be added)
 *   - toDelete: actual tuples absent from expected (need to be removed)
 *
 * Comparison ignores condition context values because FGA does not return them
 * on Read — we match on (user, relation, object) only. Condition presence
 * (name) IS compared so a tuple that loses its condition is treated as a change.
 */
export function diffTuples(
  expected: Tuple[],
  actual: Tuple[]
): { toWrite: Tuple[]; toDelete: TupleKey[] } {
  // Use a key that includes whether a condition name is present.
  const keyWithCondition = (t: Tuple): string =>
    `${tupleKeyStr(t)}\n${t.condition?.name ?? ''}`;

  const actualSet = new Set(actual.map(keyWithCondition));
  const expectedSet = new Set(expected.map(keyWithCondition));

  const toWrite = expected.filter((t) => !actualSet.has(keyWithCondition(t)));
  const toDelete: TupleKey[] = actual
    .filter((t) => !expectedSet.has(keyWithCondition(t)))
    .map(({ user, relation, object }) => ({ user, relation, object }));

  return { toWrite, toDelete };
}

// ── Write in safe batch sizes ─────────────────────────────────────────────────

// FGA's Write API has a max-items limit per call (typically 100). Chunk large
// diffs to stay within it.
const FGA_WRITE_BATCH = 100;

async function writeBatched(writes: Tuple[], deletes: TupleKey[]): Promise<void> {
  // Process writes in batches.
  for (let i = 0; i < writes.length; i += FGA_WRITE_BATCH) {
    const batch = writes.slice(i, i + FGA_WRITE_BATCH);
    await authzClient.writeTuples(batch, []);
  }
  // Process deletes in batches.
  for (let i = 0; i < deletes.length; i += FGA_WRITE_BATCH) {
    const batch = deletes.slice(i, i + FGA_WRITE_BATCH);
    await authzClient.writeTuples([], batch);
  }
}

// ── Core sync function ────────────────────────────────────────────────────────

export interface SyncResult {
  orgId: string;
  written: number;
  deleted: number;
  expectedCount: number;
  actualCount: number;
}

/**
 * Synchronise FGA tuples for a single org to match the current Postgres state.
 *
 * Idempotent by construction — safe to call multiple times or from concurrent
 * relay deliveries. Each call derives a fresh expected set from Postgres and
 * writes only the diff.
 *
 * Used by: tupleWriterSubscriber (event-driven), reconcileAllOrgs (nightly
 * cron), and the backfill script.
 */
export async function syncOrgTuples(orgId: string): Promise<SyncResult> {
  const [expected, actual] = await Promise.all([
    deriveExpectedTuples(orgId),
    readAllFgaTuples(),
  ]);

  // Filter actual to only tuples relevant to this org's objects.
  // Object IDs are real Postgres row UUIDs scoped to this org, so we derive
  // the set of objects that belong to this org from the expected list.
  const orgObjectSet = new Set(expected.map((t) => t.object));
  // Also include objects that appear as users in expected (for subject/member
  // type tuples where the user ref is a typed object, not a plain user ref).
  const orgUserSet = new Set(expected.map((t) => t.user));
  const actualForOrg = actual.filter(
    (t) => orgObjectSet.has(t.object) || orgUserSet.has(t.user) || orgObjectSet.has(t.user)
  );

  const { toWrite, toDelete } = diffTuples(expected, actualForOrg);

  if (toWrite.length > 0 || toDelete.length > 0) {
    await writeBatched(toWrite, toDelete);
  }

  return {
    orgId,
    written: toWrite.length,
    deleted: toDelete.length,
    expectedCount: expected.length,
    actualCount: actualForOrg.length,
  };
}

// ── Reconcile all orgs ────────────────────────────────────────────────────────

export interface ReconcileSummary {
  orgsProcessed: number;
  totalRepairs: number;
  results: SyncResult[];
  errors: Array<{ orgId: string; error: string }>;
}

/**
 * Nightly reconciler: run syncOrgTuples for every active org, count repairs,
 * and LOG EVERY REPAIR LOUDLY.
 *
 * A nonzero repair count means a domain mutation occurred that did NOT emit an
 * event or the subscriber failed — treat it as an upstream bug signal.
 *
 * Called by the jobs reconciler (Plan 51 Rule 3).
 */
export async function reconcileAllOrgs(): Promise<ReconcileSummary> {
  const orgs = await db
    .select({ orgId: schema.organisation.orgId })
    .from(schema.organisation)
    .where(eq(schema.organisation.status, 'VERIFIED'));

  const results: SyncResult[] = [];
  const errors: Array<{ orgId: string; error: string }> = [];

  for (const { orgId } of orgs) {
    try {
      const result = await syncOrgTuples(orgId);
      results.push(result);

      const repairs = result.written + result.deleted;
      if (repairs > 0) {
        // LOG EVERY REPAIR LOUDLY — a nonzero count is an upstream bug signal.
        console.error(
          `[authz-reconciler] REPAIR NEEDED for org ${orgId}: ` +
          `+${result.written} writes, -${result.deleted} deletes ` +
          `(expected=${result.expectedCount}, actual=${result.actualCount}). ` +
          `This indicates a domain mutation that did not emit an org-graph event ` +
          `or whose event subscriber failed. Investigate upstream.`
        );
      } else {
        console.log(`[authz-reconciler] org ${orgId} OK (${result.expectedCount} tuples)`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[authz-reconciler] ERROR for org ${orgId}: ${errMsg}`);
      errors.push({ orgId, error: errMsg });
    }
  }

  const totalRepairs = results.reduce((acc, r) => acc + r.written + r.deleted, 0);

  console.log(
    `[authz-reconciler] done — ${results.length} orgs, ${totalRepairs} total repairs, ${errors.length} errors`
  );

  return { orgsProcessed: orgs.length, totalRepairs, results, errors };
}
