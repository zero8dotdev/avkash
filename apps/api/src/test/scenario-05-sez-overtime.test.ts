// Scenario 5 — SEZ overtime threshold (Plan 38)
// Silvassa SEZ location has a 10h OT threshold vs 9h at standard factory sites.
// Working 10.5h should produce 0.5h OT at SEZ and 1.5h OT at Pune MIDC.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, schema } from '@avkash/db';
import { eq, and } from 'drizzle-orm';
import { listAttendance } from '@avkash/attendance';
import {
  createMahalaxmiOrg, createEmployee, insertPunch, cleanupOrg,
  adminCtx, type OrgFixture, type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let sezWorker: TestEmployee;
let stdWorker: TestEmployee;

// 2026-06-04 Thursday — workday for WD_6 teams
const DATE = '2026-06-04';
// A shift: 06:00 IST = 00:30 UTC
const utc = (hhmm: string) => new Date(`${DATE}T${hhmm}:00.000Z`);

beforeAll(async () => {
  fx = await createMahalaxmiOrg();

  sezWorker = await createEmployee(fx.orgId, {
    name: 'Anwar Shaikh',
    teamId: fx.team.silvassaWorkers,
    locationId: fx.loc.silvassa, // SEZ — 10h OT threshold
  });
  stdWorker = await createEmployee(fx.orgId, {
    name: 'Deepak Sawant',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune, // Standard — 9h OT threshold
  });

  // Both workers on A shift
  for (const userId of [sezWorker.userId, stdWorker.userId]) {
    await db.insert(schema.shiftAssignment).values({
      orgId: fx.orgId, userId,
      shiftId: fx.shift.a, fromDate: '2026-01-01', toDate: null,
      createdBy: 'seed',
    });
  }
});
afterAll(async () => { await cleanupOrg(fx.orgId); });

// 10.5h worked: IN 00:30 UTC (06:00 IST), OUT 11:00 UTC (16:30 IST)
async function punchLongDay(orgId: string, userId: string) {
  await db.delete(schema.attendancePunch).where(
    and(eq(schema.attendancePunch.userId, userId), eq(schema.attendancePunch.orgId, orgId))
  );
  await insertPunch(orgId, userId, { type: 'IN',  ts: utc('00:30') }); // 06:00 IST
  await insertPunch(orgId, userId, { type: 'OUT', ts: utc('11:00') }); // 16:30 IST → 10.5h
}

describe('OT threshold — SEZ (10h) vs Standard (9h)', () => {
  it('SEZ worker working 10.5h: OVERTIME with 0.5h overtimeHours', async () => {
    await punchLongDay(fx.orgId, sezWorker.userId);
    const [day] = await listAttendance(adminCtx(fx.orgId, sezWorker.userId), sezWorker.userId, DATE, DATE);
    expect(day?.marks).toContain('OVERTIME');
    // 10.5h worked − 10h SEZ threshold = 0.5h
    expect(day?.overtimeHours).toBeCloseTo(0.5, 1);
  });

  it('Standard worker working 10.5h: OVERTIME with 1.5h overtimeHours', async () => {
    await punchLongDay(fx.orgId, stdWorker.userId);
    const [day] = await listAttendance(adminCtx(fx.orgId, stdWorker.userId), stdWorker.userId, DATE, DATE);
    expect(day?.marks).toContain('OVERTIME');
    // 10.5h worked − 9h standard threshold = 1.5h
    expect(day?.overtimeHours).toBeCloseTo(1.5, 1);
  });

  it('SEZ worker working exactly 10h: no OVERTIME (at threshold, not over)', async () => {
    await db.delete(schema.attendancePunch).where(
      and(eq(schema.attendancePunch.userId, sezWorker.userId), eq(schema.attendancePunch.orgId, fx.orgId))
    );
    await insertPunch(fx.orgId, sezWorker.userId, { type: 'IN',  ts: utc('00:30') }); // 06:00 IST
    await insertPunch(fx.orgId, sezWorker.userId, { type: 'OUT', ts: utc('10:30') }); // 16:00 IST = exactly 10h

    const [day] = await listAttendance(adminCtx(fx.orgId, sezWorker.userId), sezWorker.userId, DATE, DATE);
    expect(day?.marks).not.toContain('OVERTIME');
    expect(day?.overtimeHours).toBe(0);
  });

  it('Standard worker working 9h: no OVERTIME (at threshold)', async () => {
    await db.delete(schema.attendancePunch).where(
      and(eq(schema.attendancePunch.userId, stdWorker.userId), eq(schema.attendancePunch.orgId, fx.orgId))
    );
    await insertPunch(fx.orgId, stdWorker.userId, { type: 'IN',  ts: utc('00:30') }); // 06:00 IST
    await insertPunch(fx.orgId, stdWorker.userId, { type: 'OUT', ts: utc('09:30') }); // 15:00 IST = 9h

    const [day] = await listAttendance(adminCtx(fx.orgId, stdWorker.userId), stdWorker.userId, DATE, DATE);
    expect(day?.marks).not.toContain('OVERTIME');
  });
});
