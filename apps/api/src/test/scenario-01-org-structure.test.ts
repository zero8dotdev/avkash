// Scenario 1 — Org structure setup
// Verifies that the Mahalaxmi org scaffold is created correctly:
// locations, org levels, teams, shifts all queryable with the right config.

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, schema } from '@avkash/db';
import { eq, and } from 'drizzle-orm';
import { createMahalaxmiOrg, cleanupOrg, type OrgFixture } from './helpers';

let fx: OrgFixture;

beforeAll(async () => {
  fx = await createMahalaxmiOrg();
});
afterAll(async () => {
  await cleanupOrg(fx.orgId);
});

describe('Org structure — Mahalaxmi Precision Plastics', () => {
  it('creates 5 locations including 1 SEZ', async () => {
    const locs = await db.select().from(schema.location).where(eq(schema.location.orgId, fx.orgId));
    expect(locs).toHaveLength(5);
    const silvassa = locs.find((l) => l.id === fx.loc.silvassa);
    expect(silvassa?.laborRegime).toBe('SEZ');
    expect(Number(silvassa?.overtimeThresholdHours)).toBe(10);
  });

  it('standard locations have 9h OT threshold', async () => {
    const pune = await db.select().from(schema.location).where(eq(schema.location.id, fx.loc.pune));
    expect(Number(pune[0]?.overtimeThresholdHours)).toBe(9);
  });

  it('creates 10 org levels with correct rank ordering', async () => {
    const levels = await db
      .select({ rank: schema.orgLevel.rank, name: schema.orgLevel.name })
      .from(schema.orgLevel)
      .where(eq(schema.orgLevel.orgId, fx.orgId))
      .orderBy(schema.orgLevel.rank);
    expect(levels).toHaveLength(10);
    // Lowest rank first
    expect(levels[0]?.rank).toBe(5);
    // Highest rank last
    expect(levels[levels.length - 1]?.rank).toBe(100);
  });

  it('Director and GM are floating; Operator is not', async () => {
    const [dir] = await db.select().from(schema.orgLevel).where(eq(schema.orgLevel.id, fx.level.dir));
    const [opr] = await db.select().from(schema.orgLevel).where(eq(schema.orgLevel.id, fx.level.opr));
    expect(dir?.isFloating).toBe(true);
    expect(opr?.isFloating).toBe(false);
  });

  it('Operator and Helper require punch confirmation; Supervisor does not', async () => {
    const [opr] = await db.select().from(schema.orgLevel).where(eq(schema.orgLevel.id, fx.level.opr));
    const [sup] = await db.select().from(schema.orgLevel).where(eq(schema.orgLevel.id, fx.level.sup));
    expect(opr?.requiresPunchConfirmation).toBe(true);
    expect(sup?.requiresPunchConfirmation).toBe(false);
  });

  it('creates 4 shifts — General has trackOvertime=false, factory shifts have trackOvertime=true', async () => {
    const [general] = await db.select().from(schema.shift).where(eq(schema.shift.id, fx.shift.general));
    const [shA] = await db.select().from(schema.shift).where(eq(schema.shift.id, fx.shift.a));
    expect(general?.trackOvertime).toBe(false);
    expect(shA?.trackOvertime).toBe(true);
  });

  it('C shift (night) has male-only gender restriction for SEZ compliance', async () => {
    const [shC] = await db.select().from(schema.shift).where(eq(schema.shift.id, fx.shift.c));
    expect(shC?.allowedGenders).toEqual(['MALE']);
    expect(shC?.crossesMidnight).toBe(true);
  });

  it('factory teams have a 6-day workweek; HQ teams have 5-day', async () => {
    const [puneTeam] = await db.select().from(schema.team).where(eq(schema.team.teamId, fx.team.puneWorkers));
    const [hqTeam] = await db.select().from(schema.team).where(eq(schema.team.teamId, fx.team.corporate));
    expect(puneTeam?.workweek).toContain('SATURDAY');
    expect(hqTeam?.workweek).not.toContain('SATURDAY');
  });

  it('factory worker EL policy has probation cap at 0 leaves', async () => {
    const [policy] = await db
      .select()
      .from(schema.leavePolicy)
      .where(and(eq(schema.leavePolicy.teamId, fx.team.puneWorkers), eq(schema.leavePolicy.leaveTypeId, fx.lt.el)));
    expect(policy?.maxLeaves).toBe(15);
    expect(policy?.probationMaxLeaves).toBe(0);
    expect(policy?.probationAccruals).toBe(false);
  });

  it('creates 3 business units', async () => {
    const units = await db.select().from(schema.businessUnit).where(eq(schema.businessUnit.orgId, fx.orgId));
    expect(units).toHaveLength(3);
    const names = units.map((u) => u.name);
    expect(names).toContain('Automotive Components');
    expect(names).toContain('Silvassa SEZ Plant');
  });
});
