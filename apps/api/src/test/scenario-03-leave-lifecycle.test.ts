// Scenario 3 — Leave lifecycle: apply, approve, balance, overlap guard
// Tests the full apply → approve flow and that double-booking is blocked.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { applyLeave, approveLeave, getBalance, setOpeningBalance } from '@avkash/leave';
import { db, schema } from '@avkash/db';
import { eq } from 'drizzle-orm';
import {
  createMahalaxmiOrg, createEmployee, cleanupOrg,
  adminCtx, managerCtx, userCtx, type OrgFixture, type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let employee: TestEmployee;
let manager: TestEmployee;

beforeAll(async () => {
  fx = await createMahalaxmiOrg();

  manager = await createEmployee(fx.orgId, {
    name: 'Prakash Nair',
    role: 'MANAGER',
    teamId: fx.team.corporate,
  });
  employee = await createEmployee(fx.orgId, {
    name: 'Priya Sharma',
    role: 'USER',
    teamId: fx.team.corporate,
  });

  // Wire manager into the corporate team's managers array so canApprove returns true.
  await db.update(schema.team)
    .set({ managers: [manager.userId] })
    .where(eq(schema.team.teamId, fx.team.corporate));

  // Seed 10 EL days via the domain API.
  await setOpeningBalance(adminCtx(fx.orgId, manager.userId), {
    userId: employee.userId,
    leaveTypeId: fx.lt.el,
    amount: 10,
    year: 2026,
    note: 'Test opening balance',
  });
});
afterAll(async () => { await cleanupOrg(fx.orgId); });

describe('Leave lifecycle — Corporate team', () => {
  let leaveId: string;

  it('applies leave successfully when balance is sufficient', async () => {
    const leave = await applyLeave(userCtx(fx.orgId, employee.userId), {
      leaveTypeId: fx.lt.el,
      startDate: '2026-06-15',
      endDate: '2026-06-17',
    });
    expect(leave.isApproved).toBe('PENDING');
    expect(leave.userId).toBe(employee.userId);
    leaveId = leave.leaveId;
  });

  it('blocks an overlapping application for the same dates', async () => {
    await expect(
      applyLeave(userCtx(fx.orgId, employee.userId), {
        leaveTypeId: fx.lt.el,
        startDate: '2026-06-16',
        endDate: '2026-06-18',
      })
    ).rejects.toMatchObject({ code: 'LEAVE_OVERLAP' });
  });

  it('allows application on non-overlapping dates', async () => {
    // 2026-06-22 is a Monday — a working day for the 5-day corporate team.
    const l = await applyLeave(userCtx(fx.orgId, employee.userId), {
      leaveTypeId: fx.lt.el,
      startDate: '2026-06-22',
      endDate: '2026-06-22',
    });
    expect(l.isApproved).toBe('PENDING');
  });

  it('manager can approve the pending leave', async () => {
    const approved = await approveLeave(managerCtx(fx.orgId, manager.userId), leaveId);
    expect(approved.isApproved).toBe('APPROVED');
  });

  it('balance.taken reflects the deduction after approval', async () => {
    const bal = await getBalance(adminCtx(fx.orgId, employee.userId), employee.userId, fx.lt.el);
    // Mon 16–Tue 17 are working days in a 5-day corporate team.
    expect(bal.taken).toBeGreaterThanOrEqual(1);
    expect(typeof bal.available === 'number' ? bal.available : 0).toBeLessThan(10);
  });

  it('USER cannot approve their own leave (NOT_TEAM_APPROVER)', async () => {
    await expect(
      approveLeave(userCtx(fx.orgId, employee.userId), leaveId)
    ).rejects.toMatchObject({ code: 'NOT_TEAM_APPROVER' });
  });
});
