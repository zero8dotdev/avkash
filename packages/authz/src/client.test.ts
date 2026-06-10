// Unit tests for @avkash/authz fail-closed mapping.
// Uses a stubbed SDK client — no live FGA required.
// Verifies:
//   1. FGA transport error → UnavailableError('AUTHZ_UNAVAILABLE')
//   2. check() returns false → requireRelation() throws ForbiddenError('FORBIDDEN_RELATION')
//   3. check() returns true → requireRelation() resolves
//   4. listAccessible() strips the 'type:' prefix from object ids
//   5. writeTuples() propagates SDK errors as UnavailableError

import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { FgaError } from '@openfga/sdk';
import { ForbiddenError, UnavailableError } from '@avkash/shared';
import type { AuthContext } from '@avkash/shared';

// ── Stub infrastructure ───────────────────────────────────────────────────────

// Mock @avkash/config BEFORE importing client.ts so env.parse(process.env) never
// runs (it requires DATABASE_URL which is not set in unit test environments).
mock.module('@avkash/config', () => ({
  env: {
    FGA_API_URL: 'http://localhost:8080',
    FGA_STORE_ID: 'test-store',
  },
}));

const mockCheck = mock(async (_body: unknown): Promise<{ allowed?: boolean }> => ({ allowed: true }));
const mockListObjects = mock(async (_body: unknown): Promise<{ objects?: string[] }> => ({ objects: [] }));
const mockExpand = mock(async (_body: unknown): Promise<{ tree?: unknown }> => ({ tree: {} }));
const mockWrite = mock(async (_body: unknown): Promise<void> => {});

// Patch the SDK client BEFORE importing client.ts.
mock.module('@openfga/sdk', () => ({
  OpenFgaClient: class MockOpenFgaClient {
    check = mockCheck;
    listObjects = mockListObjects;
    expand = mockExpand;
    write = mockWrite;
  },
  FgaError,
}));

// Import AFTER mocking so the module picks up the stubs.
const { authzClient } = await import('./client');

// ── Test helpers ──────────────────────────────────────────────────────────────

const ctx: AuthContext = {
  orgId: 'org-1',
  userId: 'user-abc',
  role: 'USER',
  actorType: 'user',
  assurance: 'medium',
  via: 'http',
};

function makeFgaError(message = 'network error'): FgaError {
  return Object.assign(new FgaError(message), { statusCode: 503 });
}

beforeEach(() => {
  mockCheck.mockReset();
  mockListObjects.mockReset();
  mockExpand.mockReset();
  mockWrite.mockReset();
});

// ── check() ───────────────────────────────────────────────────────────────────

describe('check()', () => {
  it('returns true when FGA returns allowed=true', async () => {
    mockCheck.mockResolvedValueOnce({ allowed: true });
    const result = await authzClient.check(ctx, 'viewer', 'employee:emp-1');
    expect(result).toBe(true);
  });

  it('returns false when FGA returns allowed=false', async () => {
    mockCheck.mockResolvedValueOnce({ allowed: false });
    const result = await authzClient.check(ctx, 'viewer', 'employee:emp-1');
    expect(result).toBe(false);
  });

  it('returns false when FGA returns allowed=undefined', async () => {
    mockCheck.mockResolvedValueOnce({});
    const result = await authzClient.check(ctx, 'viewer', 'employee:emp-1');
    expect(result).toBe(false);
  });

  it('throws UnavailableError(AUTHZ_UNAVAILABLE) on FGA transport error — FAIL CLOSED', async () => {
    mockCheck.mockRejectedValueOnce(makeFgaError('connect ECONNREFUSED'));
    const err = await authzClient.check(ctx, 'viewer', 'employee:emp-1').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UnavailableError);
    expect((err as UnavailableError).code).toBe('AUTHZ_UNAVAILABLE');
  });

  it('never returns false as a pass-through on FGA errors', async () => {
    mockCheck.mockRejectedValueOnce(makeFgaError('timeout'));
    // Must throw, not return false
    let threw = false;
    try {
      await authzClient.check(ctx, 'viewer', 'employee:emp-1');
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

// ── requireRelation() ─────────────────────────────────────────────────────────

describe('requireRelation()', () => {
  it('resolves when check returns true', async () => {
    mockCheck.mockResolvedValueOnce({ allowed: true });
    await expect(authzClient.requireRelation(ctx, 'approver', 'team:team-1')).resolves.toBeUndefined();
  });

  it('throws ForbiddenError(FORBIDDEN_RELATION) when check returns false', async () => {
    mockCheck.mockResolvedValueOnce({ allowed: false });
    await expect(authzClient.requireRelation(ctx, 'approver', 'team:team-1')).rejects.toBeInstanceOf(ForbiddenError);
    mockCheck.mockResolvedValueOnce({ allowed: false });
    const err = await authzClient.requireRelation(ctx, 'approver', 'team:team-1').catch((e: unknown) => e);
    expect((err as ForbiddenError).code).toBe('FORBIDDEN_RELATION');
    expect((err as ForbiddenError).params).toMatchObject({ relation: 'approver', object: 'team:team-1' });
  });

  it('propagates UnavailableError from check when FGA is down — FAIL CLOSED', async () => {
    mockCheck.mockRejectedValueOnce(makeFgaError('ECONNREFUSED'));
    await expect(authzClient.requireRelation(ctx, 'approver', 'team:team-1')).rejects.toBeInstanceOf(UnavailableError);
  });
});

// ── listAccessible() ──────────────────────────────────────────────────────────

describe('listAccessible()', () => {
  it('strips type prefix from returned object ids', async () => {
    mockListObjects.mockResolvedValueOnce({ objects: ['employee:abc', 'employee:def'] });
    const ids = await authzClient.listAccessible(ctx, 'viewer', 'employee');
    expect(ids).toEqual(['abc', 'def']);
  });

  it('returns empty array when FGA returns no objects', async () => {
    mockListObjects.mockResolvedValueOnce({ objects: [] });
    const ids = await authzClient.listAccessible(ctx, 'viewer', 'employee');
    expect(ids).toEqual([]);
  });

  it('throws UnavailableError on FGA transport error — FAIL CLOSED', async () => {
    mockListObjects.mockRejectedValueOnce(makeFgaError('network'));
    await expect(authzClient.listAccessible(ctx, 'viewer', 'employee')).rejects.toBeInstanceOf(UnavailableError);
  });
});

// ── writeTuples() ─────────────────────────────────────────────────────────────

describe('writeTuples()', () => {
  it('resolves when write succeeds', async () => {
    mockWrite.mockResolvedValueOnce(undefined);
    await expect(
      authzClient.writeTuples([{ user: 'user:u1', relation: 'member', object: 'team:t1' }])
    ).resolves.toBeUndefined();
  });

  it('throws UnavailableError on FGA transport error', async () => {
    mockWrite.mockRejectedValueOnce(makeFgaError('write failed'));
    await expect(
      authzClient.writeTuples([{ user: 'user:u1', relation: 'member', object: 'team:t1' }])
    ).rejects.toBeInstanceOf(UnavailableError);
  });

  it('handles empty writes/deletes gracefully', async () => {
    mockWrite.mockResolvedValueOnce(undefined);
    await expect(authzClient.writeTuples([], [])).resolves.toBeUndefined();
  });
});
