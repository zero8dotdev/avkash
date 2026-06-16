// Scenario 2 — Basic attendance: clock-in/out, marks, hours, overtime
// Tests the full listAttendance pipeline: punch pairing, shift-aware marks, OT.
// Punches are inserted in UTC; locations use Asia/Kolkata (UTC+5:30).
// A shift: 06:00–14:00 IST = 00:30–08:30 UTC.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, schema } from '@avkash/db';
import { eq, and } from 'drizzle-orm';
import { listAttendance } from '@avkash/attendance';
import { createMahalaxmiOrg, createEmployee, insertPunch, cleanupOrg, adminCtx, type OrgFixture } from './helpers';

let fx: OrgFixture;
let workerId: string;

// 2026-06-04 is a Thursday (workday in WD_6 teams).
const DATE = '2026-06-04';
// IST = UTC + 05:30. A shift starts 06:00 IST = 00:30 UTC.
const utc = (hhmm: string) => new Date(`${DATE}T${hhmm}:00.000Z`);

beforeAll(async () => {
  fx = await createMahalaxmiOrg();
  ({ userId: workerId } = await createEmployee(fx.orgId, {
    name: 'Ramesh Pawar',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune,
    levelId: fx.level.opr,
  }));
  // Assign worker to A shift from 2026-01-01 (open-ended).
  await db.insert(schema.shiftAssignment).values({
    orgId: fx.orgId,
    userId: workerId,
    shiftId: fx.shift.a,
    fromDate: '2026-01-01',
    toDate: null,
    createdBy: 'seed',
  });
});
afterAll(async () => {
  await cleanupOrg(fx.orgId);
});

async function clearPunches() {
  await db
    .delete(schema.attendancePunch)
    .where(and(eq(schema.attendancePunch.userId, workerId), eq(schema.attendancePunch.orgId, fx.orgId)));
}

async function dayFor(date = DATE) {
  const [day] = await listAttendance(adminCtx(fx.orgId, workerId), workerId, date, date);
  return day!;
}

describe('Attendance — A shift (06:00–14:00 IST)', () => {
  it('ON_TIME when punched in within grace (06:05 IST = 00:35 UTC)', async () => {
    await clearPunches();
    await insertPunch(fx.orgId, workerId, { type: 'IN', ts: utc('00:35') }); // 06:05 IST
    await insertPunch(fx.orgId, workerId, { type: 'OUT', ts: utc('08:30') }); // 14:00 IST

    const day = await dayFor();
    expect(day.marks).toContain('ON_TIME');
    expect(day.marks).not.toContain('LATE');
    expect(day.status).toBe('PRESENT');
  });

  it('LATE when punched in after grace (06:25 IST = 00:55 UTC)', async () => {
    await clearPunches();
    await insertPunch(fx.orgId, workerId, { type: 'IN', ts: utc('00:55') }); // 06:25 IST
    await insertPunch(fx.orgId, workerId, { type: 'OUT', ts: utc('08:30') }); // 14:00 IST

    const day = await dayFor();
    expect(day.marks).toContain('LATE');
  });

  it('EARLY_DEPARTURE when left more than grace before shift end', async () => {
    await clearPunches();
    await insertPunch(fx.orgId, workerId, { type: 'IN', ts: utc('00:30') }); // 06:00 IST
    await insertPunch(fx.orgId, workerId, { type: 'OUT', ts: utc('05:00') }); // 10:30 IST — well before 14:00

    const day = await dayFor();
    expect(day.marks).toContain('EARLY_DEPARTURE');
  });

  it('OVERTIME when worked more than 8h threshold (A shift trackOvertime=true)', async () => {
    await clearPunches();
    await insertPunch(fx.orgId, workerId, { type: 'IN', ts: utc('00:30') }); // 06:00 IST
    await insertPunch(fx.orgId, workerId, { type: 'OUT', ts: utc('10:00') }); // 15:30 IST — 9.5h

    const day = await dayFor();
    expect(day.marks).toContain('OVERTIME');
    expect(day.overtimeHours).toBeGreaterThan(0);
  });

  it('General Shift has trackOvertime=false — no OVERTIME even for 12h day', async () => {
    await clearPunches();
    // Override shift assignment to General for this sub-case
    await db
      .delete(schema.shiftAssignment)
      .where(and(eq(schema.shiftAssignment.userId, workerId), eq(schema.shiftAssignment.orgId, fx.orgId)));
    await db.insert(schema.shiftAssignment).values({
      orgId: fx.orgId,
      userId: workerId,
      shiftId: fx.shift.general,
      fromDate: '2026-01-01',
      toDate: null,
      createdBy: 'seed',
    });

    // 09:30 IST = 04:00 UTC; 21:30 IST = 16:00 UTC — 12h, well above 9h threshold
    await insertPunch(fx.orgId, workerId, { type: 'IN', ts: utc('04:00') }); // 09:30 IST
    await insertPunch(fx.orgId, workerId, { type: 'OUT', ts: utc('16:00') }); // 21:30 IST

    const day = await dayFor();
    expect(day.marks).not.toContain('OVERTIME');
    expect(day.overtimeHours).toBe(0);
  });
});
