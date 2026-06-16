// Model loader for @avkash/authz.
//
// Responsibilities:
//   1. Read core.fga (the compiled-in base model).
//   2. Concatenate optional module fragments (authzModel seam from AvkashModule manifests).
//   3. Transform DSL → JSON via @openfga/syntax-transformer.
//   4. Write the combined model to FGA iff it differs from the store's latest version
//      (models are immutable/versioned in FGA; we never overwrite unchanged models).
//
// Called at API boot after ensureStore() has resolved the store id.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenFgaClient, FgaError } from '@openfga/sdk';
import type { AuthorizationModel, WriteAuthorizationModelRequest } from '@openfga/sdk';
import { transformer } from '@openfga/syntax-transformer';
import { UnavailableError } from '@avkash/shared';

// ── Path resolution ───────────────────────────────────────────────────────────

/** Absolute path to core.fga, adjacent to this file's compiled location at runtime
 *  (packages/authz/src/ → packages/authz/model/core.fga). */
function resolveModelPath(): string {
  // Support both the JIT (source) path and any dist-layout variant.
  const here = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', 'model', 'core.fga');
}

// ── DSL construction ──────────────────────────────────────────────────────────

/**
 * Load and concatenate the core DSL with any module fragments.
 *
 * Each fragment must be a self-contained block of additional `type` definitions
 * (no `model` / `schema` preamble) that are appended to the core model before
 * transformation. The condition block must stay at the end — FGA's parser
 * requires conditions after type definitions.
 *
 * @param extraFragments - Additional FGA DSL type blocks from AvkashModule.authzModel.
 * @returns The combined DSL string ready for transformation.
 */
export function buildCombinedDSL(extraFragments: string[] = []): string {
  const corePath = resolveModelPath();
  const coreDSL = readFileSync(corePath, 'utf-8');

  if (extraFragments.length === 0) {
    return coreDSL;
  }

  // Strip the trailing condition block from core DSL, append fragments, re-append conditions.
  // The condition block begins with `\ncondition` — everything from that point is the conditions.
  const conditionMarker = '\ncondition ';
  const conditionIdx = coreDSL.indexOf(conditionMarker);
  if (conditionIdx === -1) {
    // No condition block — just append fragments.
    return [coreDSL, ...extraFragments].join('\n\n');
  }

  const typesSection = coreDSL.slice(0, conditionIdx);
  const conditionsSection = coreDSL.slice(conditionIdx);

  return [typesSection, ...extraFragments, conditionsSection].join('\n\n');
}

/**
 * Transform a FGA DSL string into the JSON representation accepted by the FGA Write API.
 *
 * @throws UnavailableError('AUTHZ_UNAVAILABLE') if the DSL is invalid.
 */
export function dslToJSON(dsl: string): WriteAuthorizationModelRequest {
  try {
    const jsonStr = transformer.transformDSLToJSON(dsl);
    return JSON.parse(jsonStr) as WriteAuthorizationModelRequest;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new UnavailableError(
      'AUTHZ_UNAVAILABLE',
      { cause: `DSL transform failed: ${msg}` },
      { cause: err instanceof Error ? err : new Error(msg) }
    );
  }
}

// ── Deep-compare for write-iff-changed ───────────────────────────────────────

/**
 * Compare two authorization model bodies by their semantic content.
 * We ignore `id` (FGA-assigned version id) and compare the rest structurally.
 *
 * Returns true when the models are semantically identical (no write needed).
 */
export function modelsEqual(existing: AuthorizationModel, incoming: WriteAuthorizationModelRequest): boolean {
  // Normalise by sorting type_definitions by type name and conditions by key
  // so JSON.stringify produces a stable comparison.
  const norm = (m: { schema_version: string; type_definitions: unknown[]; conditions?: Record<string, unknown> }) => ({
    schema_version: m.schema_version,
    type_definitions: [...m.type_definitions].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
    conditions: m.conditions ?? {},
  });

  return JSON.stringify(norm(existing)) === JSON.stringify(norm(incoming));
}

// ── Write-iff-changed ─────────────────────────────────────────────────────────

/**
 * Write an authorization model to the FGA store iff it differs from the store's
 * latest model. Returns the model id that is now active (existing or newly written).
 *
 * Models are immutable + versioned in FGA; creating a new one when unchanged
 * would accumulate noise in the version history. This function short-circuits
 * when the latest model is semantically identical to the incoming one.
 *
 * @param client  - Configured OpenFgaClient (store id already set).
 * @param storeId - The store id (used only for the FGA read — client must already target it).
 * @param dsl     - Combined DSL string (core + module fragments).
 * @returns The active authorization model id.
 */
export async function ensureModel(client: OpenFgaClient, _storeId: string, dsl: string): Promise<string> {
  const incoming = dslToJSON(dsl);

  try {
    // Check whether a model already exists.
    const readRes = await client.readLatestAuthorizationModel();
    const latest = readRes.authorization_model;

    if (latest?.id && modelsEqual(latest, incoming)) {
      // Already up to date — no write needed.
      return latest.id;
    }

    // Write the new model version.
    const writeRes = await client.writeAuthorizationModel(incoming);
    if (!writeRes.authorization_model_id) {
      throw new Error('writeAuthorizationModel returned no model id');
    }
    return writeRes.authorization_model_id;
  } catch (err) {
    if (err instanceof UnavailableError) throw err;
    if (err instanceof FgaError) {
      throw new UnavailableError(
        'AUTHZ_UNAVAILABLE',
        { cause: err.message, detail: 'ensureModel failed' },
        { cause: err }
      );
    }
    throw err;
  }
}

/**
 * Convenience: build the combined DSL from core.fga + fragments, then call ensureModel.
 * This is the single entry point for API boot.
 *
 * @param client       - Configured OpenFgaClient (store id already set via setStoreId).
 * @param storeId      - FGA store id (passed through to ensureModel).
 * @param extraFragments - AvkashModule.authzModel fragments to append.
 * @returns The active authorization model id.
 */
export async function loadAuthzModel(
  client: OpenFgaClient,
  storeId: string,
  extraFragments: string[] = []
): Promise<string> {
  const dsl = buildCombinedDSL(extraFragments);
  return ensureModel(client, storeId, dsl);
}
