// Store bootstrap helper — find-or-create the FGA store and wire it into the
// singleton client. Called at API boot when FGA_STORE_ID is not set in env.
// After this runs, env.FGA_STORE_ID is populated (in-process) and the singleton
// client is updated via setStoreId so subsequent calls use the correct store.

import { OpenFgaClient, FgaError } from '@openfga/sdk';
import { env } from '@avkash/config';
import { UnavailableError } from '@avkash/shared';
import { setStoreId } from './client';

/** Find-or-create the FGA store by name. Returns the store id.
 *  Idempotent — safe to call on every boot. */
export async function ensureStore(name: string): Promise<string> {
  // Use a store-less client just for the store-management API.
  const client = new OpenFgaClient({ apiUrl: env.FGA_API_URL });

  try {
    // List existing stores and look for a name match.
    const { stores } = await client.listStores();
    const existing = stores?.find((s) => s.name === name);
    if (existing?.id) {
      setStoreId(existing.id);
      return existing.id;
    }

    // Not found — create it.
    const { id } = await client.createStore({ name });
    if (!id) throw new Error(`createStore returned no id for "${name}"`);
    setStoreId(id);
    return id;
  } catch (err) {
    if (err instanceof FgaError) {
      throw new UnavailableError(
        'AUTHZ_UNAVAILABLE',
        { cause: err.message, detail: `ensureStore("${name}") failed` },
        { cause: err }
      );
    }
    throw err;
  }
}
