// Backfill script — full expected-tuple derivation + write for every org.
// Used for first deployment and disaster recovery.
//
// Run via: pnpm authz:backfill (root package.json script)
//
// This is the same code path as the reconciler's "expected" side, so it
// benefits from the same correctness proof.
//
// Note: the script imports directly from @avkash/db so it needs DATABASE_URL
// and the FGA env vars in the environment (same as the API / worker).

import { eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { bootAuthz } from '@avkash/authz';
import { syncOrgTuples } from './sync';

export async function runBackfill(): Promise<void> {
  // Resolve the FGA store + model — standalone runs have no boot-time wiring,
  // and every FGA call below needs a store id.
  const { storeId } = await bootAuthz();
  console.log(`[authz-backfill] FGA store ${storeId}`);

  const orgs = await db
    .select({ orgId: schema.organisation.orgId, name: schema.organisation.name })
    .from(schema.organisation);

  console.log(`[authz-backfill] starting — ${orgs.length} orgs`);

  let totalWritten = 0;
  let totalDeleted = 0;
  let errors = 0;

  for (const org of orgs) {
    try {
      const result = await syncOrgTuples(org.orgId);
      totalWritten += result.written;
      totalDeleted += result.deleted;
      console.log(
        `[authz-backfill] org "${org.name ?? org.orgId}": ` +
        `+${result.written} writes, -${result.deleted} deletes ` +
        `(${result.expectedCount} expected tuples)`
      );
    } catch (err) {
      errors++;
      console.error(
        `[authz-backfill] ERROR for org ${org.orgId}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  console.log(
    `[authz-backfill] done — ${orgs.length} orgs, ` +
    `+${totalWritten} written, -${totalDeleted} deleted, ${errors} errors`
  );

  if (errors > 0) {
    process.exit(1);
  }
}

// Run when executed directly.
// Bun: import.meta.main is true when this is the entry point.
// Cast via unknown to avoid TS2339 when type-checked outside bun-types context.
if ((import.meta as unknown as { main?: boolean }).main) {
  await runBackfill();
  process.exit(0);
}

// Suppress unused import warning for drizzle eq
void eq;
