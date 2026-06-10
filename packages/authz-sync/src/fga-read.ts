// Thin helper to READ all tuples from OpenFGA for a given org.
//
// The OpenFGA Read API paginates via a continuation token. This helper
// exhausts all pages and returns the full tuple list. Used by syncOrgTuples
// and reconcileAllOrgs to compute the actual state in FGA so we can diff.
//
// authz package is db-free; this file adds the db-side context so we can
// filter by orgId (object IDs in FGA are real row UUIDs — we filter by
// reading all pages and returning them; FGA has no per-org namespace here
// because the model is a single store for all orgs, so we must read all
// tuples and filter to this org's objects server-side, OR use the object IDs
// that belong to this org. The approach here is: read all FGA tuples for the
// objects we know belong to this org, derived from the Postgres schema).
//
// Practical approach: FGA's Read API takes an optional filter tuple. We call
// Read with no filter to get all tuples, then the caller diffs against expected.
// For large stores this could be expensive; a future optimisation is per-type
// page reads or a store-per-org model.

import { OpenFgaClient } from '@openfga/sdk';
import { UnavailableError, type Tuple, type TupleKey } from '@avkash/shared';
import { env } from '@avkash/config';

// ── Lazy singleton (mirrors pattern in @avkash/authz/src/client.ts) ───────────

let _readClient: OpenFgaClient | null = null;

function getReadClient(): OpenFgaClient {
  if (!_readClient) {
    _readClient = new OpenFgaClient({
      apiUrl: env.FGA_API_URL,
      storeId: env.FGA_STORE_ID ?? '',
    });
  }
  return _readClient;
}

/**
 * Set / update the FGA store id for the read client. Called by the authz
 * package's ensureStore() at boot via the exported setReadStoreId.
 */
export function setReadStoreId(storeId: string): void {
  _readClient = new OpenFgaClient({
    apiUrl: env.FGA_API_URL,
    storeId,
  });
}

// ── Tuple key helpers ─────────────────────────────────────────────────────────

/**
 * Normalise a TupleKey to a stable string for set membership checks.
 * Intentionally excludes condition context (varies at check time) so two
 * conditioned tuples with the same user/relation/object are considered equal.
 */
export function tupleKeyStr(t: TupleKey): string {
  return `${t.user}\n${t.relation}\n${t.object}`;
}

// ── Read all pages ────────────────────────────────────────────────────────────

interface FgaTupleRecord {
  key: TupleKey;
  condition?: { name?: string; context?: Record<string, unknown> | null } | null;
}

/**
 * Read all tuples from FGA (all pages). Returns TupleKey[] — conditions are
 * not returned by the Read API in the key filter form used here, so the caller
 * must treat matching as condition-unaware (we compare user+relation+object).
 *
 * On FGA transport error throws UnavailableError('AUTHZ_UNAVAILABLE') so the
 * diff/repair path fails loudly rather than silently deleting all tuples.
 */
export async function readAllFgaTuples(): Promise<Tuple[]> {
  const client = getReadClient();
  const tuples: Tuple[] = [];
  let continuationToken: string | undefined = undefined;

  try {
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await client.read(
        {},
        continuationToken ? { continuationToken } : {}
      );

      const items: FgaTupleRecord[] = res.tuples ?? [];
      for (const item of items) {
        const t: Tuple = {
          user: item.key.user,
          relation: item.key.relation,
          object: item.key.object,
        };
        if (item.condition?.name) {
          t.condition = { name: item.condition.name };
          if (item.condition.context) {
            t.condition.context = item.condition.context as Record<string, unknown>;
          }
        }
        tuples.push(t);
      }

      continuationToken = res.continuation_token ?? res.continuationToken ?? undefined;
    } while (continuationToken);
  } catch (err) {
    throw new UnavailableError(
      'AUTHZ_UNAVAILABLE',
      { cause: err instanceof Error ? err.message : String(err), detail: 'readAllFgaTuples failed' },
      { cause: err instanceof Error ? err : new Error(String(err)) }
    );
  }

  return tuples;
}
