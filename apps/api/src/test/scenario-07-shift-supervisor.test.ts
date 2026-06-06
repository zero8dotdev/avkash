// Scenario 7 — Shift supervisor scoped authority (Plan 44)
// Verifies that assignShiftSupervisor, isShiftSupervisor, and requireShiftAccess
// enforce the correct OR-gate: MANAGER role OR active supervisor scope.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  assignShiftSupervisor,
  removeShiftSupervisor,
  isShiftSupervisor,
  supervisorScope,
  requireShiftAccess,
  listShiftSupervisors,
} from '@avkash/attendance';
import {
  createMahalaxmiOrg, createEmployee, cleanupOrg,
  adminCtx, managerCtx, userCtx, type OrgFixture, type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let supervisor: TestEmployee;
let unrelatedWorker: TestEmployee;

beforeAll(async () => {
  fx = await createMahalaxmiOrg();

  supervisor = await createEmployee(fx.orgId, {
    name: 'Mohan Patil',
    role: 'USER',
    teamId: fx.team.puneSup,
    locationId: fx.loc.pune,
    levelId: fx.level.sup,
  });
  unrelatedWorker = await createEmployee(fx.orgId, {
    name: 'Ganesh Kadam',
    role: 'USER',
    teamId: fx.team.nashikWorkers,
    locationId: fx.loc.nashik,
  });
});
afterAll(async () => { await cleanupOrg(fx.orgId); });

describe('Shift supervisor authority', () => {
  let supervisorId: string;

  it('ADMIN can assign a shift supervisor', async () => {
    const rec = await assignShiftSupervisor(adminCtx(fx.orgId, supervisor.userId), {
      userId: supervisor.userId,
      shiftId: fx.shift.a,
      locationId: fx.loc.pune,
    });
    supervisorId = rec.id;
    expect(rec.userId).toBe(supervisor.userId);
    expect(rec.isActive).toBe(true);
  });

  it('isShiftSupervisor returns true for the assigned scope', async () => {
    const result = await isShiftSupervisor(
      userCtx(fx.orgId, supervisor.userId),
      fx.shift.a,
      fx.loc.pune
    );
    expect(result).toBe(true);
  });

  it('isShiftSupervisor returns false for a different shift', async () => {
    const result = await isShiftSupervisor(
      userCtx(fx.orgId, supervisor.userId),
      fx.shift.b, // B shift — not assigned
      fx.loc.pune
    );
    expect(result).toBe(false);
  });

  it('isShiftSupervisor returns false for a different location', async () => {
    const result = await isShiftSupervisor(
      userCtx(fx.orgId, supervisor.userId),
      fx.shift.a,
      fx.loc.nashik // different location
    );
    expect(result).toBe(false);
  });

  it('supervisorScope returns all active scopes for the supervisor', async () => {
    const scopes = await supervisorScope(userCtx(fx.orgId, supervisor.userId));
    expect(scopes.length).toBeGreaterThanOrEqual(1);
    const scope = scopes.find((s) => s.shiftId === fx.shift.a && s.locationId === fx.loc.pune);
    expect(scope).toBeDefined();
  });

  it('requireShiftAccess passes for a user with supervisor scope (no MANAGER role needed)', async () => {
    // Supervisor is USER role — only qualifies via shift supervisor scope.
    await expect(
      requireShiftAccess(userCtx(fx.orgId, supervisor.userId), fx.shift.a, fx.loc.pune)
    ).resolves.toBeUndefined();
  });

  it('requireShiftAccess passes for MANAGER regardless of supervisor scope', async () => {
    const mgr = await createEmployee(fx.orgId, { name: 'Ananya Iyer', role: 'MANAGER' });
    await expect(
      requireShiftAccess(managerCtx(fx.orgId, mgr.userId), fx.shift.a, fx.loc.pune)
    ).resolves.toBeUndefined();
  });

  it('requireShiftAccess throws ForbiddenError for unrelated USER with no scope', async () => {
    await expect(
      requireShiftAccess(userCtx(fx.orgId, unrelatedWorker.userId), fx.shift.a, fx.loc.pune)
    ).rejects.toMatchObject({ code: 'NOT_SHIFT_SUPERVISOR' });
  });

  it('listShiftSupervisors filters by shiftId', async () => {
    const list = await listShiftSupervisors(managerCtx(fx.orgId, supervisor.userId), { shiftId: fx.shift.a });
    expect(list.some((s) => s.userId === supervisor.userId)).toBe(true);
  });

  it('removeShiftSupervisor deactivates the record', async () => {
    await removeShiftSupervisor(adminCtx(fx.orgId, supervisor.userId), supervisorId);
    const result = await isShiftSupervisor(
      userCtx(fx.orgId, supervisor.userId),
      fx.shift.a,
      fx.loc.pune
    );
    expect(result).toBe(false);
  });
});
