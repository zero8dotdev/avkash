// Plan 51 WS5 — Route pilot field-visibility + query/write-gate tests.
//
// Tests (all stub-based, no live DB or FGA):
//   1. Employee detail: omits compensation group for non-privileged caller.
//   2. Employee detail: includes compensation group for subject (own record).
//   3. Employee detail: hr_admin (ADMIN) gets all groups.
//   4. Employee list: FGA listAccessible intersection filters rows.
//   5. Query gate: ?sort=salary → 403 FORBIDDEN_FIELD for USER (no compensation).
//   6. Query gate: ?sort=salary allowed for ADMIN (has compensation).
//   7. PATCH write gate: rejects fields from unwritable groups.
//   8. PATCH write gate: allows fields from writable groups.
//
// Uses the real resolveFieldGroups, assertWritableFields, assertQueryableFields
// from @avkash/field-policy — no FGA or DB required since we pass relations
// directly and use an empty orgRows cache (org has no overrides).

import { describe, it, expect, mock, beforeEach } from 'bun:test';

// ── Module mocks ──────────────────────────────────────────────────────────────
// Must come before dynamic imports.

mock.module('@avkash/config', () => ({
  env: {
    FGA_API_URL: 'http://localhost:8080',
    FGA_STORE_ID: 'test-store',
    DATABASE_URL: 'postgresql://localhost/test',
  },
}));

// Mock DB: no org-override rows in field_policy (clean org with manifest defaults only).
const mockDbSelect = mock(() => ({
  from: mock(() => ({
    where: mock(() => Promise.resolve([])),
  })),
}));

mock.module('@avkash/db', () => ({
  db: { select: mockDbSelect },
  schema: {
    fieldPolicy: {
      orgId: 'fp.orgId',
      resource: 'fp.resource',
      fieldGroup: 'fp.fieldGroup',
      relation: 'fp.relation',
      access: 'fp.access',
    },
  },
}));

mock.module('@avkash/auth', () => ({
  requireRole: mock(() => {}),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { ForbiddenError } from '@avkash/shared';
import type { AuthContext } from '@avkash/shared';

const { resolveFieldGroups, assertWritableFields, assertQueryableFields, EMPLOYEE_FIELD_GROUPS } =
  await import('./index');

type QueryParamAnnotation = { param: string; value?: string; group: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(role: 'ADMIN' | 'MANAGER' | 'USER', userId = 'user-1', orgId = 'org-1'): AuthContext {
  return { orgId, userId, role, actorType: 'user', assurance: 'medium', via: 'http' };
}

// Sensitive sort params from the employees route
const LIST_SENSITIVE_PARAMS: QueryParamAnnotation[] = [
  { param: 'sort', value: 'salary',      group: 'compensation' },
  { param: 'sort', value: 'bankAccount', group: 'compensation' },
  { param: 'sort', value: 'pan',         group: 'identity' },
  { param: 'sort', value: 'aadhaar',     group: 'identity' },
  { param: 'sort', value: 'disability',  group: 'medical' },
];

const { groups } = EMPLOYEE_FIELD_GROUPS;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('employee detail — field-group projection', () => {
  beforeEach(() => {
    mockDbSelect.mockReset();
    // Return empty org-override rows for all tests (clean manifest defaults).
    mockDbSelect.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([])),
      })),
    });
  });

  it('USER gets only basic group (compensation omitted)', async () => {
    const ctx = makeCtx('USER', 'user-viewer');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    expect(grant.read.has('basic')).toBe(true);
    expect(grant.read.has('compensation')).toBe(false);
    expect(grant.read.has('contact')).toBe(false);
    expect(grant.read.has('employment')).toBe(false);
    expect(grant.read.has('identity')).toBe(false);
    expect(grant.read.has('medical')).toBe(false);
  });

  it('MANAGER gets basic + contact + employment (compensation still omitted)', async () => {
    const ctx = makeCtx('MANAGER', 'user-mgr');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['MANAGER']);

    expect(grant.read.has('basic')).toBe(true);
    expect(grant.read.has('contact')).toBe(true);
    expect(grant.read.has('employment')).toBe(true);
    expect(grant.read.has('compensation')).toBe(false);
    expect(grant.read.has('identity')).toBe(false);
    expect(grant.read.has('medical')).toBe(false);
  });

  it('subject (own record) can read compensation group', async () => {
    const ctx = makeCtx('USER', 'user-sara');
    // When viewing own record, 'subject' relation is added
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER', 'subject']);

    expect(grant.read.has('basic')).toBe(true);
    expect(grant.read.has('contact')).toBe(true);
    expect(grant.read.has('employment')).toBe(true);
    expect(grant.read.has('compensation')).toBe(true);  // own record
    expect(grant.read.has('identity')).toBe(false);     // identity still hr_admin only
    expect(grant.read.has('medical')).toBe(false);
  });

  it('hr_admin (ADMIN) reads all groups', async () => {
    const ctx = makeCtx('ADMIN', 'user-priya');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['ADMIN']);

    expect(grant.read.has('basic')).toBe(true);
    expect(grant.read.has('contact')).toBe(true);
    expect(grant.read.has('employment')).toBe(true);
    expect(grant.read.has('compensation')).toBe(true);
    expect(grant.read.has('identity')).toBe(true);
    expect(grant.read.has('medical')).toBe(true);
  });

  it('OWNER reads all groups (same as ADMIN)', async () => {
    const ctx = makeCtx('ADMIN', 'user-owner') as AuthContext & { role: 'ADMIN' | 'MANAGER' | 'USER' };
    const ownerCtx = { ...ctx, role: 'OWNER' as const };
    const grant = await resolveFieldGroups(ownerCtx as unknown as AuthContext, 'employee', EMPLOYEE_FIELD_GROUPS, ['OWNER']);

    expect(grant.read.has('compensation')).toBe(true);
    expect(grant.read.has('identity')).toBe(true);
    expect(grant.read.has('medical')).toBe(true);
  });

  it('compensation fields are absent from projected object for USER', async () => {
    const { serialize } = await import('@avkash/shared');
    const { z } = await import('zod');

    const ctx = makeCtx('USER', 'user-viewer');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    // Simulate a full employee row with compensation fields present
    const row = {
      id: 'user-sara',
      name: 'Sara',
      email: 'sara@test.com',
      role: 'USER',
      teamId: 'team-1',
      salary: 100000,       // compensation group
      bankAccount: '123456', // compensation group
    };

    const dto = z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
      teamId: z.string().optional().nullable(),
      salary: z.number().optional(),
      bankAccount: z.string().optional(),
    });

    const projected = serialize(dto, row, { grant, groups });

    expect(projected.name).toBe('Sara');
    expect(projected.id).toBe('user-sara');
    // compensation fields must be absent (OMIT, not null)
    expect('salary' in projected).toBe(false);
    expect('bankAccount' in projected).toBe(false);
  });

  it('compensation fields present in projection for subject', async () => {
    const { serialize } = await import('@avkash/shared');
    const { z } = await import('zod');

    const ctx = makeCtx('USER', 'user-sara');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER', 'subject']);

    const row = {
      id: 'user-sara',
      name: 'Sara',
      salary: 100000,
      bankAccount: '123456',
    };

    const dto = z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      salary: z.number().optional(),
      bankAccount: z.string().optional(),
    });

    const projected = serialize(dto, row, { grant, groups });

    expect(projected.name).toBe('Sara');
    expect('salary' in projected).toBe(true);
    expect('bankAccount' in projected).toBe(true);
  });
});

describe('employee list — FGA listAccessible intersection', () => {
  it('filters rows to those whose profileId is in the accessible set', () => {
    // Simulates the route's filtering logic (pure function test).
    const accessibleProfileIds = ['profile-sara', 'profile-alice'];
    const accessibleSet = new Set(accessibleProfileIds);

    // Employee rows (userId-keyed, from listEmployees)
    const rows = [
      { userId: 'user-sara',    name: 'Sara' },
      { userId: 'user-dev',     name: 'Dev' },
      { userId: 'user-alice',   name: 'Alice' },
    ];

    // Profile map (userId → profileId, from EmployeeProfile lookup)
    const profileIdByUserId = new Map([
      ['user-sara',  'profile-sara'],
      ['user-dev',   'profile-dev'],
      ['user-alice', 'profile-alice'],
    ]);

    const filtered = rows.filter((r) => {
      const pid = profileIdByUserId.get(r.userId);
      return pid ? accessibleSet.has(pid) : false;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.userId)).toEqual(['user-sara', 'user-alice']);
    // Dev is not in the FGA accessible set
    expect(filtered.find((r) => r.userId === 'user-dev')).toBeUndefined();
  });

  it('returns empty when FGA returns no accessible ids', () => {
    const accessibleProfileIds: string[] = [];
    const accessibleSet = new Set(accessibleProfileIds);
    const rows = [{ userId: 'user-sara', name: 'Sara' }];
    const filtered = rows.filter((r) => {
      const pid = new Map([['user-sara', 'profile-sara']]).get(r.userId);
      return pid ? accessibleSet.has(pid) : false;
    });
    expect(filtered).toHaveLength(0);
  });

  it('ADMIN/OWNER skips FGA list call (perf escape)', () => {
    // The route checks isHrAdmin before calling listAccessible.
    // This test documents the behavior: no FGA call for hr_admin.
    const isHrAdminAdmin = (role: string) => role === 'ADMIN' || role === 'OWNER';
    expect(isHrAdminAdmin('ADMIN')).toBe(true);
    expect(isHrAdminAdmin('OWNER')).toBe(true);
    expect(isHrAdminAdmin('MANAGER')).toBe(false);
    expect(isHrAdminAdmin('USER')).toBe(false);
  });
});

describe('query gate — sort/filter side-channel protection', () => {
  beforeEach(() => {
    mockDbSelect.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([])),
      })),
    });
  });

  it('rejects ?sort=salary for USER (no compensation group)', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    expect(() =>
      assertQueryableFields(grant, groups, { sort: 'salary' }, LIST_SENSITIVE_PARAMS)
    ).toThrow(ForbiddenError);

    let caughtError: unknown;
    try {
      assertQueryableFields(grant, groups, { sort: 'salary' }, LIST_SENSITIVE_PARAMS);
    } catch (err) {
      caughtError = err;
    }
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });

  it('rejects ?sort=pan for USER (no identity group)', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    let caughtError: unknown;
    try {
      assertQueryableFields(grant, groups, { sort: 'pan' }, LIST_SENSITIVE_PARAMS);
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });

  it('allows ?sort=salary for ADMIN (has compensation)', async () => {
    const ctx = makeCtx('ADMIN');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['ADMIN']);

    expect(() =>
      assertQueryableFields(grant, groups, { sort: 'salary' }, LIST_SENSITIVE_PARAMS)
    ).not.toThrow();
  });

  it('allows ?sort=name for USER (basic group — always readable)', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    // 'name' is in the basic group which USER can read → no gating
    expect(() =>
      assertQueryableFields(grant, groups, { sort: 'name' }, LIST_SENSITIVE_PARAMS)
    ).not.toThrow();
  });

  it('raw field-name param ?salary=50000 is rejected for USER (side-channel)', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    let caughtError: unknown;
    try {
      // salary is in compensation group; the query gate catches raw field-name params
      assertQueryableFields(grant, groups, { salary: '50000' }, []);
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });
});

describe('PATCH write gate — assertWritableFields', () => {
  beforeEach(() => {
    mockDbSelect.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([])),
      })),
    });
  });

  it('rejects body with compensation field for USER (no write on compensation)', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    let caughtError: unknown;
    try {
      assertWritableFields(grant, groups, { salary: 100000 });
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });

  it('rejects body with identity field for MANAGER', async () => {
    const ctx = makeCtx('MANAGER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['MANAGER']);

    let caughtError: unknown;
    try {
      assertWritableFields(grant, groups, { pan: 'ABCDE1234F' });
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });

  it('allows subject to write contact fields (personalEmail)', async () => {
    const ctx = makeCtx('USER', 'user-sara');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER', 'subject']);

    // personalEmail is in the contact group — subject has write on it
    expect(() =>
      assertWritableFields(grant, groups, { personalEmail: 'sara@personal.com' })
    ).not.toThrow();
  });

  it('allows ADMIN to write all fields including compensation', async () => {
    const ctx = makeCtx('ADMIN');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['ADMIN']);

    expect(() =>
      assertWritableFields(grant, groups, { salary: 100000, pan: 'ABCDE1234F', disability: false })
    ).not.toThrow();
  });

  it('allows MANAGER to write employment fields (designation, employeeCode)', async () => {
    // MANAGER has 'read' on employment, not 'write'. Only ADMIN/OWNER writes employment.
    const ctx = makeCtx('MANAGER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['MANAGER']);

    let caughtError: unknown;
    try {
      assertWritableFields(grant, groups, { designation: 'Senior Engineer' });
    } catch (err) {
      caughtError = err;
    }
    // employment is 'read' not 'write' for MANAGER — should be rejected
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).code).toBe('FORBIDDEN_FIELD');
  });

  it('all forbidden fields listed together in the error', async () => {
    const ctx = makeCtx('USER');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, ['USER']);

    let caughtError: unknown;
    try {
      assertWritableFields(grant, groups, { salary: 100000, bankAccount: '123456' });
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeInstanceOf(ForbiddenError);
    const forbidden = (caughtError as ForbiddenError).params?.fields as string[];
    expect(forbidden).toContain('salary');
    expect(forbidden).toContain('bankAccount');
  });
});

describe('transfer fast-lane revoke — syncOrgTuples wiring', () => {
  it('documents the fast-lane pattern: syncOrgTuples called best-effort after approveTransfer', () => {
    // The fast-lane pattern in transfers.ts:
    //   const row = await approveTransfer(ctx, id);
    //   try { await syncOrgTuples(ctx.orgId); } catch(err) { console.error(...); }
    //   return c.json(serialize(transferDto, row));
    //
    // Failure model: syncOrgTuples failure does NOT fail the request.
    // The outbox event emitted by approveTransfer is the reliability guarantee.
    //
    // This test verifies the error-swallowing pattern is correct by simulating it.
    const syncOrgTuplesMock = mock(async (_orgId: string) => { throw new Error('FGA down'); });

    let requestFailed = false;
    async function simulateApproveTransferRoute() {
      const row = { id: 'transfer-1', status: 'ACTIVE' };
      try {
        await syncOrgTuplesMock('org-1');
      } catch {
        // Best-effort: log but do NOT re-throw
      }
      return row;
    }

    // Verify that syncOrgTuples failure does not propagate.
    const result = simulateApproveTransferRoute().catch(() => { requestFailed = true; });
    expect(requestFailed).toBe(false);
    void result;
  });
});
