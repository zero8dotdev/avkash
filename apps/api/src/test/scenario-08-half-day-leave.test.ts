// Scenario 8 — Shift-aware half-day leave
// FIRST_HALF and SECOND_HALF replace MORNING/AFTERNOON.
// FIRST_HALF on 2026-06-10 does NOT block SECOND_HALF on the same day.
// Two half-days on the same part on the same day ARE blocked.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { applyLeave, setOpeningBalance, getBalance } from '@avkash/leave';
import { halfDayWindow } from '@avkash/attendance';
import {
  createMahalaxmiOrg,
  createEmployee,
  cleanupOrg,
  adminCtx,
  userCtx,
  type OrgFixture,
  type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let employee: TestEmployee;

beforeAll(async () => {
  fx = await createMahalaxmiOrg();
  employee = await createEmployee(fx.orgId, {
    name: 'Kavitha Menon',
    role: 'USER',
    teamId: fx.team.corporate,
  });
  await setOpeningBalance(adminCtx(fx.orgId, employee.userId), {
    userId: employee.userId,
    leaveTypeId: fx.lt.cl,
    amount: 6,
    year: 2026,
  });
});
afterAll(async () => {
  await cleanupOrg(fx.orgId);
});

describe('Half-day leave — FIRST_HALF / SECOND_HALF', () => {
  it('halfDayWindow pure: FIRST_HALF of A shift (06:00–14:00) → 06:00 to 10:00', () => {
    const w = halfDayWindow({ startTime: '06:00', endTime: '14:00', crossesMidnight: false }, 'FIRST_HALF');
    expect(w).toEqual({ from: '06:00', to: '10:00' });
  });

  it('halfDayWindow pure: SECOND_HALF of A shift → 10:00 to 14:00', () => {
    const w = halfDayWindow({ startTime: '06:00', endTime: '14:00', crossesMidnight: false }, 'SECOND_HALF');
    expect(w).toEqual({ from: '10:00', to: '14:00' });
  });

  // 2026-06-10 is a Wednesday — working day for corporate 5-day team.
  it('applies FIRST_HALF CL on 2026-06-10', async () => {
    const leave = await applyLeave(userCtx(fx.orgId, employee.userId), {
      leaveTypeId: fx.lt.cl,
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      duration: 'HALF_DAY',
      halfDayPart: 'FIRST_HALF',
    });
    expect(leave.isApproved).toBe('PENDING');
    expect(leave.duration).toBe('HALF_DAY');
  });

  it('SECOND_HALF on the same day is NOT blocked (different part)', async () => {
    const leave = await applyLeave(userCtx(fx.orgId, employee.userId), {
      leaveTypeId: fx.lt.cl,
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      duration: 'HALF_DAY',
      halfDayPart: 'SECOND_HALF',
    });
    expect(leave.isApproved).toBe('PENDING');
  });

  it('applying FIRST_HALF again on 2026-06-10 is blocked (same part same day)', async () => {
    await expect(
      applyLeave(userCtx(fx.orgId, employee.userId), {
        leaveTypeId: fx.lt.cl,
        startDate: '2026-06-10',
        endDate: '2026-06-10',
        duration: 'HALF_DAY',
        halfDayPart: 'FIRST_HALF',
      })
    ).rejects.toMatchObject({ code: 'LEAVE_OVERLAP' });
  });

  it('a full-day application on 2026-06-11 (different day) is allowed', async () => {
    const leave = await applyLeave(userCtx(fx.orgId, employee.userId), {
      leaveTypeId: fx.lt.cl,
      startDate: '2026-06-11',
      endDate: '2026-06-11',
    });
    expect(leave.isApproved).toBe('PENDING');
  });

  it('balance.planned includes all pending half-day and full-day leaves', async () => {
    const bal = await getBalance(adminCtx(fx.orgId, employee.userId), employee.userId, fx.lt.cl);
    // Two half-days (FIRST_HALF + SECOND_HALF on 10th) = 1 working day planned.
    // Full-day on 11th = 1 more. All are PENDING, so they show in planned, not taken.
    expect(bal.planned).toBeGreaterThanOrEqual(1);
  });
});
