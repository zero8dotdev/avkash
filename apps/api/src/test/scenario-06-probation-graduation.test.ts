// Scenario 6 — Probation graduation (Plan 43)
// runProbationCompletion transitions PROBATION employees whose probationEndsOn
// is in the past to ACTIVE, sets confirmedOn, and writes an audit entry.
// During probation, EL balance is capped at 0 (factory worker policy).

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, schema } from '@avkash/db';
import { eq } from 'drizzle-orm';
import { runProbationCompletion } from '@avkash/leave';
import { getBalance, setOpeningBalance } from '@avkash/leave';
import {
  createMahalaxmiOrg, createEmployee, cleanupOrg,
  adminCtx, type OrgFixture, type TestEmployee,
} from './helpers';

let fx: OrgFixture;
let probationary: TestEmployee;
let stillOnProbation: TestEmployee;

beforeAll(async () => {
  fx = await createMahalaxmiOrg();

  // Worker whose probation ended in the past → should graduate.
  probationary = await createEmployee(fx.orgId, {
    name: 'Sunita Yadav',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune,
    levelId: fx.level.opr,
    employmentStatus: 'PROBATION',
    probationEndsOn: '2026-05-01', // past — 35 days ago
    joinedOn: '2025-11-01',
  });

  // Worker still on probation → should NOT graduate.
  stillOnProbation = await createEmployee(fx.orgId, {
    name: 'Raju Jadhav',
    teamId: fx.team.puneWorkers,
    locationId: fx.loc.pune,
    levelId: fx.level.opr,
    employmentStatus: 'PROBATION',
    probationEndsOn: '2026-12-01', // future
    joinedOn: '2026-06-01',
  });

  // Give both employees EL opening balance to test probation cap.
  for (const w of [probationary, stillOnProbation]) {
    await setOpeningBalance(adminCtx(fx.orgId, w.userId), {
      userId: w.userId,
      leaveTypeId: fx.lt.el,
      amount: 10,
      year: 2026,
    });
  }
});
afterAll(async () => { await cleanupOrg(fx.orgId); });

describe('Probation overlay and graduation', () => {
  it('factory worker on PROBATION cannot use EL (probationMaxLeaves = 0)', async () => {
    const bal = await getBalance(adminCtx(fx.orgId, probationary.userId), probationary.userId, fx.lt.el);
    // applyProbationOverlay caps maxLeaves to 0 during PROBATION.
    // Even though 10 days were credited, available should be 0.
    expect(bal.available).toBe(0);
  });

  it('runProbationCompletion graduates worker whose probationEndsOn is past', async () => {
    const result = await runProbationCompletion(new Date('2026-06-06T00:00:00Z'));
    expect(result.transitioned).toBeGreaterThanOrEqual(1);

    const [profile] = await db
      .select({ status: schema.employeeProfile.employmentStatus, confirmedOn: schema.employeeProfile.confirmedOn })
      .from(schema.employeeProfile)
      .where(eq(schema.employeeProfile.userId, probationary.userId));
    expect(profile?.status).toBe('ACTIVE');
    expect(profile?.confirmedOn).not.toBeNull();
  });

  it('worker still on probation is not graduated', async () => {
    const [profile] = await db
      .select({ status: schema.employeeProfile.employmentStatus })
      .from(schema.employeeProfile)
      .where(eq(schema.employeeProfile.userId, stillOnProbation.userId));
    expect(profile?.status).toBe('PROBATION');
  });

  it('after graduation, EL balance is no longer capped at 0', async () => {
    const bal = await getBalance(adminCtx(fx.orgId, probationary.userId), probationary.userId, fx.lt.el);
    // Now ACTIVE → probation overlay does not apply → available = 10
    expect(typeof bal.available === 'number' ? bal.available : -1).toBeGreaterThan(0);
  });
});
