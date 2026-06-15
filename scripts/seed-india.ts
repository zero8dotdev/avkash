/**
 * scripts/seed-india.ts — Idempotent India HR demo seed
 *
 * Enriches the EXISTING Meridian Manufacturing org (created by seed-meridian.ts)
 * with India-specific HR features for the "full-product India story" demo.
 *
 * Safe to re-run — every entity is looked up before being created.
 * Running seed-meridian.ts again after this script is also safe.
 *
 * Usage:
 *   DATABASE_URL=postgres://avkash:avkash@localhost:5432/avkash bun scripts/seed-india.ts
 *   or via: pnpm demo:seed:india
 *
 * What is seeded:
 *   1. Locations: Coimbatore Plant (STANDARD, Asia/Kolkata) + Bengaluru HQ (STANDARD, Asia/Kolkata)
 *   2. Leave types: CL, SL, EL (kind=LEAVE), Maternity Leave (kind=LEAVE), Compensatory Off (kind=COMP_OFF)
 *   3. Leave policies for Assembly team: CL 12/yr, SL 12/yr, EL 15/yr accrued+rollover+encashable,
 *      ML 182d proxy, CompOff 90d expiry
 *   4. Holidays 2026: national (Republic Day, Independence Day, Gandhi Jayanti, Holi, Diwali)
 *      + regional: Pongal + Tamil New Year (Coimbatore only)
 *               + Karnataka Rajyotsava (Bengaluru only)
 *   5. Workweek patterns: Alternate-Saturday (2-week cycle, Assembly/factory),
 *      Mon–Fri (HQ). Assembly team assigned Alternate-Saturday pattern.
 *   6. Comp-off: Rohan grants Sara 1 comp-off day for working Sunday 2026-06-07 → PENDING
 *   7. Blackout: Q2 FY2027 quarter-end Sep 25–30 2026, Coimbatore location
 *   8. Attendance regularization: Sara missed punch-out on 2026-06-05 → PENDING
 *
 * Known limitations:
 *   - ML 26-week semantic: LeavePolicy has no maxWeeks/paidWeeks column.
 *     maxLeaves=182 (26*7) used as a crude proxy.
 *   - Location field on Holiday is a free string (not a FK to Location.id).
 *     We store the Location UUID as the string — listHolidays with ?location=<id>
 *     will correctly filter by it.
 */

import { db, schema } from '@avkash/db';
import { createLocation } from '@avkash/org';
import { createLeaveType, createLeavePolicy, earnCompOff, createBlackout } from '@avkash/leave';
import { addCustomHoliday } from '@avkash/holidays';
import { createWorkweekPattern } from '@avkash/attendance';
import { and, eq } from 'drizzle-orm';
import type { AuthContext } from '@avkash/shared';

// ── Stable IDs from seed-meridian.ts ─────────────────────────────────────────
// These are the fixed UUIDs written by the idempotent Meridian seed.
const ORG_ID = '6a5109da-bad7-4515-9b0c-7ecff8dc9448';
const TEAM_ASSEMBLY_ID = '9829047a-23a6-4e8d-b431-1b516190a60e';
const SARA_ID = 'e208de76-cb76-4b2e-a562-318092def28f';
const ROHAN_ID = 'f45b7018-e4c0-4be4-aaed-25b7b65cd09f';
const PRIYA_ID = '157a55a6-e7b5-4474-9f48-44fae5bb6814';

// ── Auth context helpers ──────────────────────────────────────────────────────

function adminCtx(): AuthContext {
  return { orgId: ORG_ID, userId: PRIYA_ID, role: 'ADMIN', actorType: 'user', assurance: 'high', via: 'system' };
}

function managerCtx(): AuthContext {
  return { orgId: ORG_ID, userId: ROHAN_ID, role: 'MANAGER', actorType: 'user', assurance: 'medium', via: 'system' };
}

function log(label: string, value: string, note = '') {
  const short = value.length > 12 ? value.slice(0, 8) + '…' : value;
  console.log(`  [${label.padEnd(18)}] ${short}  ${note ? '← ' + note : ''}`);
}

// ── Idempotent helpers ────────────────────────────────────────────────────────

async function findOrCreateLocation(
  name: string,
  timezone: string,
  address: string,
  laborRegime: 'STANDARD' | 'SEZ' | 'SHOP_ESTABLISHMENT' | 'OTHER' = 'STANDARD'
): Promise<string> {
  const [ex] = await db
    .select({ id: schema.location.id })
    .from(schema.location)
    .where(and(eq(schema.location.orgId, ORG_ID), eq(schema.location.name, name)))
    .limit(1);
  if (ex) { log('location', ex.id, `${name} existing`); return ex.id; }
  const row = await createLocation(adminCtx(), { name, timezone, address, laborRegime });
  log('location', row.id, `${name} created`);
  return row.id;
}

async function findOrCreateLeaveType(
  name: string,
  kind: 'LEAVE' | 'COMP_OFF',
  isPaid: boolean,
  color: string
): Promise<string> {
  const [ex] = await db
    .select({ leaveTypeId: schema.leaveType.leaveTypeId })
    .from(schema.leaveType)
    .where(and(eq(schema.leaveType.orgId, ORG_ID), eq(schema.leaveType.name, name)))
    .limit(1);
  if (ex) { log('leave-type', ex.leaveTypeId, `${name} existing`); return ex.leaveTypeId; }
  const row = await createLeaveType(adminCtx(), { name, kind, isPaid, color });
  log('leave-type', row.leaveTypeId, `${name} created`);
  return row.leaveTypeId;
}

async function findOrCreateLeavePolicy(
  leaveTypeId: string,
  teamId: string,
  opts: {
    maxLeaves?: number;
    unlimited?: boolean;
    accruals?: boolean;
    accrualFrequency?: 'MONTHLY' | 'QUARTERLY';
    accrueOn?: 'BEGINNING' | 'END';
    rollOver?: boolean;
    rollOverLimit?: number;
    rollOverExpiry?: string;
    encashable?: boolean;
    encashmentMaxDays?: number;
    compOffExpiryDays?: number;
    autoApprove?: boolean;
    prorateOnJoin?: boolean;
    probationMaxLeaves?: number;
    probationAccruals?: boolean;
    probationEncashable?: boolean;
  }
): Promise<string> {
  const [ex] = await db
    .select({ leavePolicyId: schema.leavePolicy.leavePolicyId })
    .from(schema.leavePolicy)
    .where(
      and(
        eq(schema.leavePolicy.teamId, teamId),
        eq(schema.leavePolicy.leaveTypeId, leaveTypeId),
        eq(schema.leavePolicy.isActive, true)
      )
    )
    .limit(1);
  if (ex) { log('leave-policy', ex.leavePolicyId, 'existing'); return ex.leavePolicyId; }
  const row = await createLeavePolicy(adminCtx(), { leaveTypeId, teamId, ...opts });
  log('leave-policy', row.leavePolicyId, 'created');
  return row.leavePolicyId;
}

async function findOrCreateWorkweekPattern(
  name: string,
  cycleLength: number,
  weeks: string[][],
  referenceDate: string
): Promise<string> {
  const [ex] = await db
    .select({ id: schema.workweekPattern.id })
    .from(schema.workweekPattern)
    .where(and(eq(schema.workweekPattern.orgId, ORG_ID), eq(schema.workweekPattern.name, name)))
    .limit(1);
  if (ex) { log('workweek', ex.id, `${name} existing`); return ex.id; }
  const row = await createWorkweekPattern(adminCtx(), { name, cycleLength, weeks, referenceDate });
  log('workweek', row.id, `${name} created`);
  return row.id;
}

async function upsertHoliday(
  name: string,
  date: string,
  isRecurring: boolean,
  location?: string
): Promise<string> {
  const conds: ReturnType<typeof eq>[] = [
    eq(schema.holiday.orgId, ORG_ID),
    eq(schema.holiday.name, name),
  ];
  if (location) conds.push(eq(schema.holiday.location, location));
  const [ex] = await db
    .select({ holidayId: schema.holiday.holidayId })
    .from(schema.holiday)
    .where(and(...conds))
    .limit(1);
  if (ex) { log('holiday', ex.holidayId, `${name} existing`); return ex.holidayId; }
  const row = await addCustomHoliday(adminCtx(), { name, date, location, isRecurring });
  log('holiday', row.holidayId, `${name}${location ? ' [' + location.slice(0, 8) + '…]' : ''} created`);
  return row.holidayId;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Meridian India HR Demo — Seed                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Verify the Meridian org exists — seed-meridian.ts must have run first
  const [org] = await db
    .select({ orgId: schema.organisation.orgId, name: schema.organisation.name })
    .from(schema.organisation)
    .where(eq(schema.organisation.orgId, ORG_ID))
    .limit(1);
  if (!org) {
    throw new Error(`Meridian org ${ORG_ID} not found — run pnpm demo:seed first`);
  }
  console.log(`  Org: ${org.name} (${org.orgId})\n`);

  // ── 1. Locations ─────────────────────────────────────────────────────
  console.log('► 1. Locations');
  const locCoimbatoreId = await findOrCreateLocation(
    'Coimbatore Plant',
    'Asia/Kolkata',
    'SIPCOT Industrial Complex, Coimbatore, Tamil Nadu 641020',
    'STANDARD'
  );
  const locBengaluruId = await findOrCreateLocation(
    'Bengaluru HQ',
    'Asia/Kolkata',
    'Koramangala, Bengaluru, Karnataka 560034',
    'STANDARD'
  );

  // Assign Coimbatore to Assembly team (the factory floor team)
  await db
    .update(schema.team)
    .set({ locationId: locCoimbatoreId })
    .where(eq(schema.team.teamId, TEAM_ASSEMBLY_ID));
  log('team→location', TEAM_ASSEMBLY_ID, 'Assembly → Coimbatore Plant');

  // ── 2. Leave Types ────────────────────────────────────────────────────
  console.log('\n► 2. Indian Leave Types');
  const ltCLId = await findOrCreateLeaveType('Casual Leave', 'LEAVE', true, 'F59E0B');
  const ltSLId = await findOrCreateLeaveType('Sick Leave', 'LEAVE', true, '10B981');
  const ltELId = await findOrCreateLeaveType('Earned Leave', 'LEAVE', true, '3B82F6');
  // ML: paid statutory leave; no maxWeeks column exists — see limitation note in header
  const ltMLId = await findOrCreateLeaveType('Maternity Leave', 'LEAVE', true, 'EC4899');
  // COMP_OFF kind is required by earnCompOff() validation
  const ltCompOffId = await findOrCreateLeaveType('Compensatory Off', 'COMP_OFF', true, '8B5CF6');

  // ── 3. Leave Policies (Assembly team) ────────────────────────────────
  console.log('\n► 3. Leave Policies (Assembly team)');

  // CL: 12/year, no accrual, no rollover; probation capped at 6
  const polCLId = await findOrCreateLeavePolicy(ltCLId, TEAM_ASSEMBLY_ID, {
    maxLeaves: 12,
    unlimited: false,
    accruals: false,
    rollOver: false,
    encashable: false,
    autoApprove: false,
    prorateOnJoin: true,
    probationMaxLeaves: 6,
    probationAccruals: false,
    probationEncashable: false,
  });
  log('pol/CL', polCLId, 'CL 12/yr');

  // SL: 12/year, no accrual, no rollover
  const polSLId = await findOrCreateLeavePolicy(ltSLId, TEAM_ASSEMBLY_ID, {
    maxLeaves: 12,
    unlimited: false,
    accruals: false,
    rollOver: false,
    encashable: false,
    autoApprove: false,
    prorateOnJoin: true,
  });
  log('pol/SL', polSLId, 'SL 12/yr');

  // EL: 15/year, monthly accrual (1.25d/mo), carry-forward max 30, encashable max 15
  // Probation: no EL accrual (convention per Factories Act)
  const polELId = await findOrCreateLeavePolicy(ltELId, TEAM_ASSEMBLY_ID, {
    maxLeaves: 15,
    unlimited: false,
    accruals: true,
    accrualFrequency: 'MONTHLY',
    accrueOn: 'BEGINNING',
    rollOver: true,
    rollOverLimit: 30,
    rollOverExpiry: '03/31', // Indian FY ends March 31
    encashable: true,
    encashmentMaxDays: 15,
    autoApprove: false,
    prorateOnJoin: true,
    probationAccruals: false,
    probationMaxLeaves: 0,
    probationEncashable: false,
  });
  log('pol/EL', polELId, 'EL 15/yr accrued+encashable');

  // ML: 182-day proxy (26 weeks × 7; no maxWeeks column)
  const polMLId = await findOrCreateLeavePolicy(ltMLId, TEAM_ASSEMBLY_ID, {
    maxLeaves: 182,
    unlimited: false,
    accruals: false,
    rollOver: false,
    encashable: false,
    autoApprove: false,
    prorateOnJoin: false,
  });
  log('pol/ML', polMLId, 'ML 182d proxy (26wk × 7d)');

  // CompOff: credit-based (balance from earnCompOff approvals), 90-day expiry
  const polCompOffId = await findOrCreateLeavePolicy(ltCompOffId, TEAM_ASSEMBLY_ID, {
    maxLeaves: 0,
    unlimited: false,
    accruals: false,
    rollOver: false,
    encashable: false,
    compOffExpiryDays: 90,
    autoApprove: false,
    prorateOnJoin: false,
  });
  log('pol/CompOff', polCompOffId, 'CompOff 90d expiry');

  // ── 4. Holiday Calendars 2026 ─────────────────────────────────────────
  console.log('\n► 4. Holiday Calendars 2026');

  // National / org-wide (no location = applies everywhere)
  await upsertHoliday('Republic Day', '2026-01-26', true);
  await upsertHoliday('Independence Day', '2026-08-15', true);
  await upsertHoliday('Gandhi Jayanti', '2026-10-02', true);

  // Major national festivals — movable dates (year-specific)
  await upsertHoliday('Holi', '2026-03-03', false);
  await upsertHoliday('Diwali', '2026-10-19', false);

  // Regional: Coimbatore Plant — Tamil Nadu
  // location field on Holiday is varchar; we store the Location UUID string for API filtering
  await upsertHoliday('Pongal', '2026-01-14', false, locCoimbatoreId);
  await upsertHoliday('Tamil New Year', '2026-04-14', false, locCoimbatoreId);

  // Regional: Bengaluru HQ — Karnataka
  await upsertHoliday('Karnataka Rajyotsava', '2026-11-01', true, locBengaluruId);

  // ── 5. Workweek Patterns ──────────────────────────────────────────────
  console.log('\n► 5. Workweek Patterns');

  // Factory: 2-week alternating cycle (1st/3rd Saturday working)
  // Week 1: Mon–Sat; Week 2: Mon–Fri
  // referenceDate: 2026-01-05 (first Monday of 2026, a valid cycle anchor)
  const altSatId = await findOrCreateWorkweekPattern(
    'Alternate Saturday (1st/3rd working)',
    2,
    [
      ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ],
    '2026-01-05'
  );

  // HQ / corporate: standard Mon–Fri
  const monFriId = await findOrCreateWorkweekPattern(
    'Mon–Fri (HQ)',
    1,
    [['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']],
    '2026-01-05'
  );

  // Assign Alternate-Saturday pattern to Assembly (factory) team
  await db
    .update(schema.team)
    .set({ workweekPatternId: altSatId })
    .where(eq(schema.team.teamId, TEAM_ASSEMBLY_ID));
  log('team→pattern', TEAM_ASSEMBLY_ID, 'Assembly → Alternate Saturday');

  // ── 6. Comp-off: Sara worked Sunday 2026-06-07 ────────────────────────
  console.log('\n► 6. Comp-off (Sara worked 2026-06-07)');
  const [existingCO] = await db
    .select({ id: schema.compOff.id })
    .from(schema.compOff)
    .where(
      and(
        eq(schema.compOff.orgId, ORG_ID),
        eq(schema.compOff.userId, SARA_ID),
        eq(schema.compOff.workedOn, '2026-06-07')
      )
    )
    .limit(1);

  let compOffId: string;
  if (existingCO) {
    compOffId = existingCO.id;
    log('comp-off', compOffId, 'Sara 2026-06-07 existing');
  } else {
    // Rohan (MANAGER) grants comp-off on Sara's behalf — manager-granting is allowed
    const co = await earnCompOff(managerCtx(), {
      userId: SARA_ID,
      workedOn: '2026-06-07',
      leaveTypeId: ltCompOffId,
      days: 1,
    });
    compOffId = co.id;
    log('comp-off', compOffId, 'Sara 2026-06-07 PENDING created');
  }

  // ── 7. Leave Blackout: Q2 FY2027 quarter-end ─────────────────────────
  // Indian FY = Apr–Mar; Q2 ends Sep 30. Factory dispatch peak: last week of Sep.
  console.log('\n► 7. Leave Blackout (Q2 FY2027 Sep 25–30, Coimbatore)');
  const [existingBL] = await db
    .select({ id: schema.leaveBlackout.id })
    .from(schema.leaveBlackout)
    .where(
      and(
        eq(schema.leaveBlackout.orgId, ORG_ID),
        eq(schema.leaveBlackout.name, 'Q2 FY2027 Quarter-End Freeze')
      )
    )
    .limit(1);

  let blackoutId: string;
  if (existingBL) {
    blackoutId = existingBL.id;
    log('blackout', blackoutId, 'Q2 FY2027 existing');
  } else {
    const bl = await createBlackout(adminCtx(), {
      name: 'Q2 FY2027 Quarter-End Freeze',
      startDate: '2026-09-25',
      endDate: '2026-09-30',
      leaveTypeId: null,       // all leave types blocked
      locationId: locCoimbatoreId, // Coimbatore factory only
    });
    blackoutId = bl.id;
    log('blackout', blackoutId, 'Sep 25–30 Coimbatore created');
  }

  // ── 8. Attendance Regularization: Sara missed punch-out 2026-06-05 ───
  console.log('\n► 8. Attendance Regularization (Sara missed punch-out 2026-06-05)');
  const [existingReg] = await db
    .select({ id: schema.attendanceRegularization.id })
    .from(schema.attendanceRegularization)
    .where(
      and(
        eq(schema.attendanceRegularization.orgId, ORG_ID),
        eq(schema.attendanceRegularization.userId, SARA_ID),
        eq(schema.attendanceRegularization.date, '2026-06-05')
      )
    )
    .limit(1);

  let regularizationId: string;
  if (existingReg) {
    regularizationId = existingReg.id;
    log('regularization', regularizationId, 'Sara 2026-06-05 existing');
  } else {
    // Direct insert — requestRegularization() reads ctx.userId for self-only;
    // we bypass to seed on Sara's behalf from the admin side.
    const [row] = await db
      .insert(schema.attendanceRegularization)
      .values({
        orgId: ORG_ID,
        userId: SARA_ID,
        teamId: TEAM_ASSEMBLY_ID,
        date: '2026-06-05',
        requestedIn: new Date('2026-06-05T03:00:00Z'),   // 8:30am IST = UTC+5:30
        requestedOut: new Date('2026-06-05T12:00:00Z'),  // 5:30pm IST
        reason: 'Badge reader offline at factory gate — forgot to tap out',
        status: 'PENDING',
        createdBy: 'seed-india',
      })
      .returning();
    regularizationId = row!.id;
    log('regularization', regularizationId, 'Sara 2026-06-05 PENDING created');
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const ids = {
    locCoimbatoreId,
    locBengaluruId,
    ltCLId,
    ltSLId,
    ltELId,
    ltMLId,
    ltCompOffId,
    polCLId,
    polSLId,
    polELId,
    polMLId,
    polCompOffId,
    altSatPatternId: altSatId,
    monFriPatternId: monFriId,
    compOffId,
    blackoutId,
    regularizationId,
  };

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  India Demo Seed Complete                          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`  loc:Coimbatore   ${locCoimbatoreId}`);
  console.log(`  loc:Bengaluru    ${locBengaluruId}`);
  console.log(`  lt:CL            ${ltCLId}`);
  console.log(`  lt:SL            ${ltSLId}`);
  console.log(`  lt:EL            ${ltELId}`);
  console.log(`  lt:ML            ${ltMLId}`);
  console.log(`  lt:CompOff       ${ltCompOffId}`);
  console.log(`  pat:AltSat       ${altSatId}`);
  console.log(`  pat:MonFri       ${monFriId}`);
  console.log(`  compOff:Sara     ${compOffId}`);
  console.log(`  blackout:Q2      ${blackoutId}`);
  console.log(`  reg:Sara         ${regularizationId}`);
  console.log('\nJSON (copy for INDIA_IDS env):');
  console.log(JSON.stringify(ids, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[seed-india] FATAL:', err);
    process.exit(1);
  });
