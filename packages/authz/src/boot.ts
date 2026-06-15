// Boot-time setup helper.
//
// Called once at API startup before the server accepts requests.
// Combines ensureStore + loadAuthzModel into a single call so apps/api/src/index.ts
// stays minimal. ensureStore() must be called at boot before any OpenFGA operation.

import { OpenFgaClient } from '@openfga/sdk';
import { env } from '@avkash/config';
import { ensureStore } from './store';
import { loadAuthzModel } from './model';

/**
 * Boot-time authz initialization.
 *
 * Step 1: ensureStore('avkash') — find-or-create the FGA store and wire the
 *         store id into the singleton AuthzClient via setStoreId.
 * Step 2: loadAuthzModel — build DSL from core.fga (+ optional module fragments),
 *         transform to JSON, and write to FGA iff it differs from the current model
 *         (models are immutable + versioned in FGA; no-op when unchanged).
 *
 * @param extraFragments - AvkashModule.authzModel DSL fragments (empty until the
 *   module registry is wired; until then, pass [] here and list
 *   private fragments as a TODO in apps/api).
 * @returns The active store id and authorization model id.
 *
 * Fail mode: throws UnavailableError('AUTHZ_UNAVAILABLE') if FGA is unreachable.
 * The caller should log the error and allow the server to start anyway — guarded
 * routes return 503 until FGA recovers (fail-closed by design).
 */
export async function bootAuthz(extraFragments: string[] = []): Promise<{ storeId: string; modelId: string }> {
  // ensureStore finds-or-creates the store and calls setStoreId so the singleton
  // client is wired for all subsequent check/require/list calls.
  const storeId = await ensureStore('avkash');

  // Build a store-scoped client specifically for the model write call.
  // (The singleton is already updated by setStoreId; this is a local client
  //  for loadAuthzModel's explicit OpenFgaClient parameter.)
  const client = new OpenFgaClient({
    apiUrl: env.FGA_API_URL,
    storeId,
  });

  const modelId = await loadAuthzModel(client, storeId, extraFragments);

  return { storeId, modelId };
}
