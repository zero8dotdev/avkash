// Unit tests for packages/users/src/audit.ts (Plan 51 WS6 — sensitive-read audit).
//
// Tests run with Bun's built-in test runner. All DB calls are stubbed via
// module mock so no real Postgres is required.

import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import type { AuthContext } from '@avkash/shared';

// ── Module mocks (must appear before the module under test is imported) ────────

// Stub the db client so no real Postgres connection is attempted.
const insertValues = mock(() => Promise.resolve());
const insertMock = mock(() => ({ values: insertValues }));

mock.module('@avkash/db', () => ({
  db: { insert: insertMock },
  schema: {
    activityLog: 'activityLog_stub',
  },
}));

// Import the module under test AFTER mocks are registered.
const { writeSensitiveReadAudit } = await import('./audit');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<AuthContext>): AuthContext {
  return {
    orgId: 'org-1',
    userId: 'caller-user-id',
    role: 'ADMIN',
    actorType: 'user',
    assurance: 'medium',
    via: 'http',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('writeSensitiveReadAudit', () => {
  beforeEach(() => {
    insertMock.mockClear();
    insertValues.mockClear();
  });

  afterEach(() => {
    insertMock.mockClear();
    insertValues.mockClear();
  });

  it('writes an audit row with keyword employee.sensitive_fields.read', async () => {
    const ctx = makeCtx();
    await writeSensitiveReadAudit(ctx, 'target-user-1', ['identity']);

    expect(insertMock).toHaveBeenCalledTimes(1);
    // The first call to insert() receives the table reference.
    expect(insertMock).toHaveBeenCalledWith('activityLog_stub');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valuesArg = (insertValues.mock.calls as any[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(valuesArg).toBeDefined();
    expect(valuesArg!.keyword).toBe('employee.sensitive_fields.read');
    expect(valuesArg!.orgId).toBe('org-1');
    expect(valuesArg!.userId).toBe('target-user-1');
    expect(valuesArg!.changedBy).toBe('caller-user-id');
    expect(valuesArg!.tableName).toBe('EmployeeProfile');
  });

  it('records all audited groups in changedColumns.groups', async () => {
    const ctx = makeCtx();
    await writeSensitiveReadAudit(ctx, 'target-user-2', ['identity', 'medical']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valuesArg = (insertValues.mock.calls as any[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(valuesArg!.changedColumns).toEqual({
      groups: ['identity', 'medical'],
      targetUserId: 'target-user-2',
    });
  });

  it('records the targetUserId in changedColumns', async () => {
    const ctx = makeCtx({ userId: 'priya-id' });
    await writeSensitiveReadAudit(ctx, 'sara-id', ['medical']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valuesArg = (insertValues.mock.calls as any[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect((valuesArg!.changedColumns as Record<string, unknown>).targetUserId).toBe('sara-id');
  });

  it('sets changedBy to ctx.userId', async () => {
    const ctx = makeCtx({ userId: 'priya-id' });
    await writeSensitiveReadAudit(ctx, 'sara-id', ['identity']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valuesArg = (insertValues.mock.calls as any[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(valuesArg!.changedBy).toBe('priya-id');
  });

  it('sets changedBy to null when ctx.userId is null (system actor)', async () => {
    const ctx = makeCtx({ userId: null });
    await writeSensitiveReadAudit(ctx, 'target-id', ['identity']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valuesArg = (insertValues.mock.calls as any[][])[0]?.[0] as Record<string, unknown> | undefined;
    expect(valuesArg!.changedBy).toBeNull();
  });

  it('resolves without throwing even for a single audited group', async () => {
    const ctx = makeCtx();
    await expect(writeSensitiveReadAudit(ctx, 'target-id', ['medical'])).resolves.toBeUndefined();
  });
});
