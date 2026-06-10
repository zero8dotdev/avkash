// Unit tests for @avkash/authz model loader (Plan 51 WS2).
// Uses a stubbed OpenFgaClient — no live FGA required.
// Verifies:
//   1. buildCombinedDSL() returns core DSL unchanged when no fragments supplied.
//   2. buildCombinedDSL() correctly splices module fragments before the condition block.
//   3. dslToJSON() produces a valid WriteAuthorizationModelRequest.
//   4. modelsEqual() correctly identifies equal/unequal models.
//   5. ensureModel() skips write when model matches the store's latest.
//   6. ensureModel() writes a new model when the store's latest differs.
//   7. ensureModel() writes a new model when no model exists in the store yet.
//   8. ensureModel() propagates FGA transport errors as UnavailableError.

import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { FgaError } from '@openfga/sdk';
import { UnavailableError } from '@avkash/shared';
import type { AuthorizationModel } from '@openfga/sdk';

// ── Stub @avkash/config before importing model.ts ───────────────────────────
mock.module('@avkash/config', () => ({
  env: {
    FGA_API_URL: 'http://localhost:8080',
    FGA_STORE_ID: 'test-store',
  },
}));

// Import model functions AFTER mocking.
const { buildCombinedDSL, dslToJSON, modelsEqual, ensureModel } = await import('./model');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFgaError(message = 'network error'): FgaError {
  return Object.assign(new FgaError(message), { statusCode: 503 });
}

/** Build a minimal valid AuthorizationModel (as returned by readLatestAuthorizationModel). */
function makeExistingModel(overrides: Partial<AuthorizationModel> = {}): AuthorizationModel {
  return {
    id: 'model-existing-id',
    schema_version: '1.1',
    type_definitions: [{ type: 'user', relations: {}, metadata: null as unknown as undefined }],
    conditions: {},
    ...overrides,
  };
}

// ── buildCombinedDSL() ────────────────────────────────────────────────────────

describe('buildCombinedDSL()', () => {
  it('returns core DSL unchanged when no fragments are supplied', () => {
    const dsl = buildCombinedDSL();
    // Must contain the schema preamble and all required types.
    expect(dsl).toContain('schema 1.1');
    expect(dsl).toContain('type user');
    expect(dsl).toContain('type org');
    expect(dsl).toContain('type business_unit');
    expect(dsl).toContain('type department');
    expect(dsl).toContain('type team');
    expect(dsl).toContain('type employee');
    expect(dsl).toContain('type leave_request');
    expect(dsl).toContain('condition active_window');
  });

  it('splices module fragments between the type section and the condition block', () => {
    const fragment = 'type payslip\n  relations\n    define viewer: [user]';
    const dsl = buildCombinedDSL([fragment]);
    // Fragment must appear after type definitions but before conditions.
    const fragIdx = dsl.indexOf('type payslip');
    const condIdx = dsl.indexOf('condition active_window');
    expect(fragIdx).toBeGreaterThan(-1);
    expect(condIdx).toBeGreaterThan(-1);
    expect(fragIdx).toBeLessThan(condIdx);
  });

  it('the combined DSL parses correctly when a fragment is added', () => {
    const fragment = 'type payslip\n  relations\n    define subject: [user]';
    const dsl = buildCombinedDSL([fragment]);
    // dslToJSON must not throw (i.e. the combined DSL is valid).
    expect(() => dslToJSON(dsl)).not.toThrow();
    const model = dslToJSON(dsl);
    const types = model.type_definitions.map((td) => td.type);
    expect(types).toContain('payslip');
    expect(types).toContain('user');
    expect(types).toContain('leave_request');
  });

  it('splices multiple fragments in order', () => {
    const f1 = 'type payslip\n  relations\n    define subject: [user]';
    const f2 = 'type document\n  relations\n    define viewer: [user]';
    const dsl = buildCombinedDSL([f1, f2]);
    const model = dslToJSON(dsl);
    const types = model.type_definitions.map((td) => td.type);
    expect(types).toContain('payslip');
    expect(types).toContain('document');
  });
});

// ── dslToJSON() ───────────────────────────────────────────────────────────────

describe('dslToJSON()', () => {
  it('transforms core DSL to a valid WriteAuthorizationModelRequest', () => {
    const coreDSL = buildCombinedDSL();
    const model = dslToJSON(coreDSL);
    expect(model.schema_version).toBe('1.1');
    expect(model.type_definitions).toBeArray();
    const types = model.type_definitions.map((td) => td.type);
    expect(types).toContain('user');
    expect(types).toContain('org');
    expect(types).toContain('team');
    expect(types).toContain('employee');
    expect(types).toContain('leave_request');
  });

  it('throws UnavailableError(AUTHZ_UNAVAILABLE) on invalid DSL', () => {
    expect(() => dslToJSON('this is not valid fga dsl {{{')).toThrow(UnavailableError);
  });
});

// ── modelsEqual() ─────────────────────────────────────────────────────────────

describe('modelsEqual()', () => {
  it('returns true for identical models (ignoring id)', () => {
    const incoming = dslToJSON(buildCombinedDSL());
    const existing: AuthorizationModel = {
      id: 'old-id',
      schema_version: incoming.schema_version,
      type_definitions: incoming.type_definitions as AuthorizationModel['type_definitions'],
      conditions: incoming.conditions,
    };
    expect(modelsEqual(existing, incoming)).toBe(true);
  });

  it('returns false when type_definitions differ', () => {
    const incoming = dslToJSON(buildCombinedDSL());
    const existing = makeExistingModel({
      schema_version: incoming.schema_version,
      // Different type_definitions
      type_definitions: [{ type: 'user', relations: {}, metadata: null as unknown as undefined }],
    });
    expect(modelsEqual(existing, incoming)).toBe(false);
  });

  it('returns false when schema_version differs', () => {
    const incoming = dslToJSON(buildCombinedDSL());
    const existing = makeExistingModel({
      ...incoming,
      id: 'old-id',
      schema_version: '1.0',
    } as unknown as AuthorizationModel);
    expect(modelsEqual(existing, incoming)).toBe(false);
  });
});

// ── ensureModel() — stubs ─────────────────────────────────────────────────────

const mockReadLatestAuthorizationModel = mock(async (): Promise<{ authorization_model?: AuthorizationModel }> => ({
  authorization_model: undefined,
}));
const mockWriteAuthorizationModel = mock(async (_body: unknown): Promise<{ authorization_model_id?: string }> => ({
  authorization_model_id: 'new-model-id',
}));

const mockFgaClient = {
  readLatestAuthorizationModel: mockReadLatestAuthorizationModel,
  writeAuthorizationModel: mockWriteAuthorizationModel,
} as unknown as import('@openfga/sdk').OpenFgaClient;

const coreDSL = buildCombinedDSL();
const coreModelJSON = dslToJSON(coreDSL);

beforeEach(() => {
  mockReadLatestAuthorizationModel.mockReset();
  mockWriteAuthorizationModel.mockReset();
});

describe('ensureModel()', () => {
  it('skips write and returns existing model id when model is unchanged', async () => {
    const existingModel: AuthorizationModel = {
      id: 'existing-model-id',
      schema_version: coreModelJSON.schema_version,
      type_definitions: coreModelJSON.type_definitions as AuthorizationModel['type_definitions'],
      conditions: coreModelJSON.conditions ?? {},
    };
    mockReadLatestAuthorizationModel.mockResolvedValueOnce({
      authorization_model: existingModel,
    });

    const modelId = await ensureModel(mockFgaClient, 'store-id', coreDSL);
    expect(modelId).toBe('existing-model-id');
    expect(mockWriteAuthorizationModel).not.toHaveBeenCalled();
  });

  it('writes a new model and returns new id when store has no model yet', async () => {
    mockReadLatestAuthorizationModel.mockResolvedValueOnce({ authorization_model: undefined });
    mockWriteAuthorizationModel.mockResolvedValueOnce({ authorization_model_id: 'brand-new-id' });

    const modelId = await ensureModel(mockFgaClient, 'store-id', coreDSL);
    expect(modelId).toBe('brand-new-id');
    expect(mockWriteAuthorizationModel).toHaveBeenCalledTimes(1);
  });

  it('writes a new model when the store model differs from incoming', async () => {
    const staleModel: AuthorizationModel = makeExistingModel({
      id: 'stale-id',
      type_definitions: [{ type: 'user', relations: {}, metadata: null as unknown as undefined }],
    });
    mockReadLatestAuthorizationModel.mockResolvedValueOnce({ authorization_model: staleModel });
    mockWriteAuthorizationModel.mockResolvedValueOnce({ authorization_model_id: 'updated-model-id' });

    const modelId = await ensureModel(mockFgaClient, 'store-id', coreDSL);
    expect(modelId).toBe('updated-model-id');
    expect(mockWriteAuthorizationModel).toHaveBeenCalledTimes(1);
  });

  it('throws UnavailableError on FGA transport error during read', async () => {
    mockReadLatestAuthorizationModel.mockRejectedValueOnce(makeFgaError('ECONNREFUSED'));
    await expect(ensureModel(mockFgaClient, 'store-id', coreDSL)).rejects.toBeInstanceOf(UnavailableError);
    expect(mockWriteAuthorizationModel).not.toHaveBeenCalled();
  });

  it('throws UnavailableError on FGA transport error during write', async () => {
    mockReadLatestAuthorizationModel.mockResolvedValueOnce({ authorization_model: undefined });
    mockWriteAuthorizationModel.mockRejectedValueOnce(makeFgaError('write failed'));
    await expect(ensureModel(mockFgaClient, 'store-id', coreDSL)).rejects.toBeInstanceOf(UnavailableError);
  });
});
