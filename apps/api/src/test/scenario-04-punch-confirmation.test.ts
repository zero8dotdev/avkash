// Scenario 4 — Punch confirmation (Plan 40)
// WEB punches from OPERATOR-level employees are held PENDING_CONFIRMATION.
// A manager confirms them; punches then feed into attendance computation.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, schema } from '@avkash/db';
import { eq } from 'drizzle-orm';
import { confirmPunches, listAttendance, listPendingConfirmations } from '@avkash/attendance';
import {
  createMahalaxmiOrg, createEmployee, insertPunch, cleanupOrg,
  adminCtx, managerCtx, type OrgFixture, type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let worker: TestEmployee;
let mgr: TestEmployee;

// 2026-06-05 Friday
const DATE = '2026-06-05';
// A shift: 06:00–14:00 IST = 00:30–08:30 UTC
const utc = (hhmm: string) => new Date(`${DATE}T${hhmm}:00.000Z`);

beforeAll(async () => {
  fx = await createMahalaxmiOrg();

  mgr = await createEmployee(fx.orgId, {
    name: 'Vijay Kulkarni',
    role: 'MANAGER',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune,
  });
  worker = await createEmployee(fx.orgId, {
    name: 'Dinesh Bhosale',
    role: 'USER',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune,
    levelId: fx.level.opr, // OPR requires punch confirmation
  });
  // Wire mgr into the team's managers array so managedTeamIds returns it.
  await db.update(schema.team)
    .set({ managers: [mgr.userId] })
    .where(eq(schema.team.teamId, fx.team.puneWorkers));

  // Assign A shift
  await db.insert(schema.shiftAssignment).values({
    orgId: fx.orgId, userId: worker.userId,
    shiftId: fx.shift.a, fromDate: '2026-01-01', toDate: null,
    createdBy: 'seed',
  });
});
afterAll(async () => { await cleanupOrg(fx.orgId); });

describe('Punch confirmation — OPERATOR level', () => {
  let punchId: string;

  it('WEB punch is inserted with PENDING_CONFIRMATION status', async () => {
    const p = await insertPunch(fx.orgId, worker.userId, {
      type: 'IN',
      ts: utc('00:35'), // 06:05 IST
      source: 'WEB',
      confirmationStatus: 'PENDING_CONFIRMATION',
    });
    punchId = p.id;
    expect(p.confirmationStatus).toBe('PENDING_CONFIRMATION');
  });

  it('pending punch appears in listPendingConfirmations for the team', async () => {
    const pending = await listPendingConfirmations(managerCtx(fx.orgId, mgr.userId), fx.team.puneWorkers);
    const found = pending.find((p) => p.id === punchId);
    expect(found).toBeDefined();
  });

  it('pending punch is excluded from attendance computation (PUNCH_PENDING_CONFIRMATION mark)', async () => {
    // Add a matching OUT punch (also pending so no session forms)
    await insertPunch(fx.orgId, worker.userId, {
      type: 'OUT',
      ts: utc('08:30'), // 14:00 IST
      source: 'WEB',
      confirmationStatus: 'PENDING_CONFIRMATION',
    });

    const [day] = await listAttendance(adminCtx(fx.orgId, worker.userId), worker.userId, DATE, DATE);
    // Both punches are pending → no paired session → not PRESENT
    expect(day?.marks).toContain('PUNCH_PENDING_CONFIRMATION');
    expect(day?.status).not.toBe('PRESENT');
  });

  it('manager can confirm the pending punch', async () => {
    // Get all pending punch IDs for this worker
    const pending = await listPendingConfirmations(managerCtx(fx.orgId, mgr.userId), fx.team.puneWorkers);
    const ids = pending.filter((p) => p.userId === worker.userId).map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);

    await confirmPunches(managerCtx(fx.orgId, mgr.userId), ids, 'CONFIRM');

    const confirmed = await db
      .select({ status: schema.attendancePunch.confirmationStatus })
      .from(schema.attendancePunch)
      .where(eq(schema.attendancePunch.id, ids[0]!));
    expect(confirmed[0]?.status).toBe('CONFIRMED');
  });

  it('after confirmation, punches form a session and status becomes PRESENT', async () => {
    const [day] = await listAttendance(adminCtx(fx.orgId, worker.userId), worker.userId, DATE, DATE);
    expect(day?.status).toBe('PRESENT');
    expect(day?.marks).not.toContain('PUNCH_PENDING_CONFIRMATION');
    expect(day?.marks).toContain('ON_TIME');
  });
});
