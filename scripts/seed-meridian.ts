/**
 * scripts/seed-meridian.ts — Idempotent demo seed for "Meridian Manufacturing"
 *
 * Builds the Meridian Manufacturing org used for the enterprise-authz demo
 * (beats 1–8 in docs/demo-enterprise-authz.md). Safe to re-run — each entity is
 * looked up by name or email before being created, so a second pass is a no-op.
 *
 * Usage:
 *   DATABASE_URL=postgres://avkash:avkash@localhost:5432/avkash bun scripts/seed-meridian.ts
 *   or via: pnpm demo:seed
 *
 * HRBP caveat: the BusinessUnit table has no hrbp_user_id column.
 * The HRBP relationship (Anita on Plants BU) is written directly as an FGA tuple
 * via authzClient.writeTuples(). This is a MANUAL-TUPLE step: the tuple is NOT
 * backed by any DB column and will be removed by the nightly reconciler (deriveExpectedTuples
 * does not emit it). Re-run demo:seed before each demo session to restore it.
 * Long-term fix: add a BusinessUnit.hrbpUserId column and instrument it in
 * packages/authz-sync/src/derive.ts.
 *
 * Compensation/identity columns caveat: EmployeeProfile has no salary, bankAccount,
 * pan, aadhaar etc. columns yet. Sara's profile is seeded with the columns that DO
 * exist. The field-group enforcement is structurally in place and will activate when
 * the schema columns are added.
 *
 * API key (beat 6): Not implemented — demo:smoke prints SKIPPED.
 */

import { db, schema } from '@avkash/db';
import { createOrganization, createBusinessUnit, createDepartment } from '@avkash/org';
import { createTeam } from '@avkash/users';
import { createLeaveType, applyLeave } from '@avkash/leave';
import { syncOrgTuples } from '@avkash/authz-sync';
import { authzClient, bootAuthz } from '@avkash/authz';
import { objectRef, userRef, FGA_TYPES } from '@avkash/shared';
import { and, eq } from 'drizzle-orm';
import type { AuthContext } from '@avkash/shared';

// ── Personas config ────────────────────────────────────────────────────────────

const MERIDIAN_ORG_NAME = 'Meridian Manufacturing';

const PERSONAS = {
  priya: { name: 'Priya Sharma', email: 'priya@meridian-demo.example.com', role: 'ADMIN' as const },
  rohan: { name: 'Rohan Mehta', email: 'rohan@meridian-demo.example.com', role: 'MANAGER' as const },
  sara: { name: 'Sara Khan', email: 'sara@meridian-demo.example.com', role: 'USER' as const },
  dev: { name: 'Dev Iyer', email: 'dev@meridian-demo.example.com', role: 'MANAGER' as const },
  anita: { name: 'Anita Pillai', email: 'anita@meridian-demo.example.com', role: 'USER' as const },
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function sysCtx(orgId: string): AuthContext {
  return { orgId, userId: null, role: 'ADMIN', actorType: 'system', assurance: 'high', via: 'system' };
}

function log(label: string, value: string, note = '') {
  const short = value.length > 12 ? value.slice(0, 8) + '…' : value;
  console.log(`  [${label.padEnd(12)}] ${short}  ${note ? '← ' + note : ''}`);
}

/** Find-or-insert a User row; returns the user's `id`. */
async function upsertUser(
  orgId: string,
  teamId: string,
  persona: { name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'USER' }
): Promise<string> {
  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, persona.email))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(schema.user)
    .values({
      name: persona.name,
      email: persona.email,
      emailVerified: true,
      role: persona.role,
      orgId,
      teamId,
    })
    .returning({ id: schema.user.id });
  return row!.id;
}

/** Find-or-insert an EmployeeProfile row; returns the profile `id`.
 *  NOTE: compensation/identity/medical columns do not exist yet in EmployeeProfile. */
async function upsertProfile(
  userId: string,
  orgId: string,
  opts: { designation?: string; employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'; workLocation?: string; employeeCode?: string }
): Promise<string> {
  const [existing] = await db
    .select({ id: schema.employeeProfile.id })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, userId))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(schema.employeeProfile)
    .values({
      userId,
      orgId,
      designation: opts.designation ?? null,
      employmentType: opts.employmentType ?? 'FULL_TIME',
      workLocation: opts.workLocation ?? null,
      employeeCode: opts.employeeCode ?? null,
      employmentStatus: 'ACTIVE',
      createdBy: 'seed-meridian',
    })
    .returning({ id: schema.employeeProfile.id });
  return row!.id;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Meridian Manufacturing — Demo Seed      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Resolve the FGA store + model first — host-side scripts have no boot-time
  // wiring, and without a store id every FGA call below fails (storeId required).
  const { storeId } = await bootAuthz();
  console.log(`  FGA store ${storeId}\n`);

  // ── 1. Organisation ─────────────────────────────────────────────────────────
  console.log('► 1. Organisation');
  let orgId: string;
  const [existingOrg] = await db
    .select({ orgId: schema.organisation.orgId })
    .from(schema.organisation)
    .where(eq(schema.organisation.name, MERIDIAN_ORG_NAME))
    .limit(1);

  if (existingOrg) {
    orgId = existingOrg.orgId;
    log('org', orgId, 'existing');
  } else {
    // createOrganization creates a default "General" team + OWNER invitation.
    const { org } = await createOrganization({
      orgName: MERIDIAN_ORG_NAME,
      ownerEmail: PERSONAS.priya.email,
    });
    // Mark VERIFIED so the nightly reconciler picks it up.
    await db
      .update(schema.organisation)
      .set({ status: 'VERIFIED', isSetupCompleted: true })
      .where(eq(schema.organisation.orgId, org.orgId));
    orgId = org.orgId;
    log('org', orgId, 'created');
  }
  const ctx = sysCtx(orgId);

  // ── 2. Business Units ──────────────────────────────────────────────────────
  console.log('\n► 2. Business Units');

  async function findOrCreateBU(name: string): Promise<string> {
    const [ex] = await db
      .select({ id: schema.businessUnit.id })
      .from(schema.businessUnit)
      .where(and(eq(schema.businessUnit.orgId, orgId), eq(schema.businessUnit.name, name)))
      .limit(1);
    if (ex) { log('bu', ex.id, `${name} existing`); return ex.id; }
    const row = await createBusinessUnit(ctx, { name });
    log('bu', row.id, `${name} created`);
    return row.id;
  }

  const buPlantsId = await findOrCreateBU('Plants');
  const buCorporateId = await findOrCreateBU('Corporate');

  // ── 3. Departments ─────────────────────────────────────────────────────────
  console.log('\n► 3. Departments');

  async function findOrCreateDept(name: string, code: string): Promise<string> {
    const [ex] = await db
      .select({ id: schema.department.id })
      .from(schema.department)
      .where(and(eq(schema.department.orgId, orgId), eq(schema.department.code, code)))
      .limit(1);
    if (ex) { log('dept', ex.id, `${name} (${code}) existing`); return ex.id; }
    const row = await createDepartment(ctx, { name, code });
    log('dept', row.id, `${name} (${code}) created`);
    return row.id;
  }

  // Manufacturing under Plants; Finance under Corporate.
  // Note: Department has no businessUnitId FK — BU linkage is via user.businessUnitId
  // and the FGA business_unit→department tuple written in derive.ts. The team's
  // departmentId links the team into the department; the BU scoping comes from
  // users.businessUnitId and the BU FGA object's org relation.
  const deptManufacturingId = await findOrCreateDept('Manufacturing', 'MFG');
  const deptFinanceId = await findOrCreateDept('Finance', 'FIN');

  // ── 4. Teams ───────────────────────────────────────────────────────────────
  console.log('\n► 4. Teams');

  async function findOrCreateTeam(name: string, departmentId: string): Promise<string> {
    const [ex] = await db
      .select({ teamId: schema.team.teamId })
      .from(schema.team)
      .where(and(eq(schema.team.orgId, orgId), eq(schema.team.name, name)))
      .limit(1);
    if (ex) { log('team', ex.teamId, `${name} existing`); return ex.teamId; }
    const row = await createTeam(ctx, { name, departmentId });
    log('team', row.teamId, `${name} created`);
    return row.teamId;
  }

  const teamAssemblyId = await findOrCreateTeam('Assembly', deptManufacturingId);
  const teamLogisticsId = await findOrCreateTeam('Logistics', deptManufacturingId);

  // The default "General" team created by createOrganization (for Priya / Anita
  // who don't have a primary production team).
  const [generalTeamRow] = await db
    .select({ teamId: schema.team.teamId })
    .from(schema.team)
    .where(and(eq(schema.team.orgId, orgId), eq(schema.team.name, 'General')))
    .limit(1);
  const defaultTeamId = generalTeamRow?.teamId ?? teamAssemblyId;

  // ── 5. Personas ────────────────────────────────────────────────────────────
  console.log('\n► 5. Personas');

  // Priya — org ADMIN / hr_admin
  const priyaId = await upsertUser(orgId, defaultTeamId, PERSONAS.priya);
  await db.update(schema.user).set({ role: 'ADMIN' }).where(eq(schema.user.id, priyaId));
  log('user/priya', priyaId, 'ADMIN/hr_admin');

  // Rohan — MANAGER, Team Assembly
  const rohanId = await upsertUser(orgId, teamAssemblyId, PERSONAS.rohan);
  await db.update(schema.user)
    .set({ role: 'MANAGER', teamId: teamAssemblyId })
    .where(eq(schema.user.id, rohanId));
  log('user/rohan', rohanId, 'MANAGER, Assembly');

  // Sara — USER, Team Assembly (has compensation/identity profile — columns future)
  const saraId = await upsertUser(orgId, teamAssemblyId, PERSONAS.sara);
  await db.update(schema.user)
    .set({ role: 'USER', teamId: teamAssemblyId, businessUnitId: buPlantsId })
    .where(eq(schema.user.id, saraId));
  log('user/sara', saraId, 'USER, Assembly, Plants BU');

  // Dev — MANAGER, Team Logistics
  const devId = await upsertUser(orgId, teamLogisticsId, PERSONAS.dev);
  await db.update(schema.user)
    .set({ role: 'MANAGER', teamId: teamLogisticsId })
    .where(eq(schema.user.id, devId));
  log('user/dev', devId, 'MANAGER, Logistics');

  // Anita — USER, Plants BU HRBP (HRBP FGA tuple written below as manual step)
  const anitaId = await upsertUser(orgId, defaultTeamId, PERSONAS.anita);
  await db.update(schema.user)
    .set({ role: 'USER', businessUnitId: buPlantsId })
    .where(eq(schema.user.id, anitaId));
  log('user/anita', anitaId, 'USER, Plants BU (HRBP tuple below)');

  // ── 6. Wire team managers ──────────────────────────────────────────────────
  console.log('\n► 6. Wire team managers');
  await db.update(schema.team)
    .set({ managers: [rohanId] })
    .where(eq(schema.team.teamId, teamAssemblyId));
  log('managers', teamAssemblyId, `Rohan (${rohanId.slice(0, 8)}…)`);

  await db.update(schema.team)
    .set({ managers: [devId] })
    .where(eq(schema.team.teamId, teamLogisticsId));
  log('managers', teamLogisticsId, `Dev (${devId.slice(0, 8)}…)`);

  // ── 7. Employee Profiles ───────────────────────────────────────────────────
  // Compensation/identity/medical columns do NOT exist in EmployeeProfile yet.
  // Seeding with existing columns only. The field-group enforcement will activate
  // when the compensation/identity/medical columns are added to EmployeeProfile.
  console.log('\n► 7. Employee Profiles');

  const priyaProfileId = await upsertProfile(priyaId, orgId, {
    designation: 'HR Director', employeeCode: 'MFG-001', workLocation: 'Corporate HQ',
  });
  log('profile/priya', priyaProfileId, 'HR Director');

  const rohanProfileId = await upsertProfile(rohanId, orgId, {
    designation: 'Assembly Manager', employeeCode: 'MFG-002', workLocation: 'Plant A',
  });
  log('profile/rohan', rohanProfileId, 'Assembly Manager');

  // Sara — future: salary/pan/aadhaar would go here when schema columns exist.
  const saraProfileId = await upsertProfile(saraId, orgId, {
    designation: 'Assembly Technician', employeeCode: 'MFG-003', workLocation: 'Plant A',
    employmentType: 'FULL_TIME',
  });
  log('profile/sara', saraProfileId, 'Assembly Technician (no comp/id cols yet)');

  const devProfileId = await upsertProfile(devId, orgId, {
    designation: 'Logistics Manager', employeeCode: 'MFG-004', workLocation: 'Plant A',
  });
  log('profile/dev', devProfileId, 'Logistics Manager');

  const anitaProfileId = await upsertProfile(anitaId, orgId, {
    designation: 'HR Business Partner', employeeCode: 'MFG-005', workLocation: 'Plants HQ',
  });
  log('profile/anita', anitaProfileId, 'HR Business Partner');

  // ── 8. Leave Type ─────────────────────────────────────────────────────────
  console.log('\n► 8. Leave Type');
  let leaveTypeId: string;
  const [existingLT] = await db
    .select({ leaveTypeId: schema.leaveType.leaveTypeId })
    .from(schema.leaveType)
    .where(and(eq(schema.leaveType.orgId, orgId), eq(schema.leaveType.name, 'Annual Leave')))
    .limit(1);
  if (existingLT) {
    leaveTypeId = existingLT.leaveTypeId;
    log('leave-type', leaveTypeId, 'existing');
  } else {
    const lt = await createLeaveType(ctx, {
      name: 'Annual Leave', color: '3B82F6', kind: 'LEAVE', isPaid: true,
    });
    leaveTypeId = lt.leaveTypeId;
    log('leave-type', leaveTypeId, 'Annual Leave created');
  }

  // ── 9. Sara's pending leave request ───────────────────────────────────────
  // This is the target of beat 1 (Rohan approves → 200; Dev tries → 403).
  console.log('\n► 9. Sara pending leave request');
  let saraLeaveId: string;
  const [existingLeave] = await db
    .select({ leaveId: schema.leave.leaveId })
    .from(schema.leave)
    .where(
      and(
        eq(schema.leave.orgId, orgId),
        eq(schema.leave.userId, saraId),
        eq(schema.leave.isApproved, 'PENDING')
      )
    )
    .limit(1);

  if (existingLeave) {
    saraLeaveId = existingLeave.leaveId;
    log('leave', saraLeaveId, 'Sara pending leave existing');
  } else {
    // Apply on Sara's behalf. Using Monday/Tuesday dates to ensure working days.
    const saraLeaveCtx: AuthContext = {
      orgId, userId: saraId, role: 'USER',
      actorType: 'user', assurance: 'medium', via: 'system',
    };
    // applyLeave validates balance — if policy is unlimited this passes;
    // if not, we catch and fall back to a direct insert for seeding.
    try {
      const leave = await applyLeave(saraLeaveCtx, {
        leaveTypeId,
        startDate: '2026-07-14',
        endDate: '2026-07-15',
        reason: 'Family function (demo seed)',
      });
      saraLeaveId = leave.leaveId;
      log('leave', saraLeaveId, 'Sara pending leave created via applyLeave');
    } catch {
      // Fallback: direct insert (balance checks may block on fresh org with no accrual).
      const [row] = await db
        .insert(schema.leave)
        .values({
          leaveTypeId,
          startDate: '2026-07-14',
          endDate: '2026-07-15',
          duration: 'FULL_DAY',
          halfDayPart: 'NONE',
          isApproved: 'PENDING',
          userId: saraId,
          teamId: teamAssemblyId,
          orgId,
          reason: 'Family function (demo seed)',
          workingDays: '2',
          createdBy: 'seed-meridian',
        })
        .returning({ leaveId: schema.leave.leaveId });
      saraLeaveId = row!.leaveId;
      log('leave', saraLeaveId, 'Sara pending leave created via direct insert');
    }
  }

  // ── 10. FGA org-graph sync ─────────────────────────────────────────────────
  console.log('\n► 10. FGA org-graph sync (syncOrgTuples)');
  let syncResult = { orgId, written: 0, deleted: 0, expectedCount: 0, actualCount: 0 };
  try {
    syncResult = await syncOrgTuples(orgId);
    log('fga-sync', orgId, `written=${syncResult.written} deleted=${syncResult.deleted} expected=${syncResult.expectedCount}`);
  } catch (err) {
    console.warn('  ⚠  FGA sync skipped — OpenFGA not reachable:', err instanceof Error ? err.message : String(err));
    console.warn('     Run "pnpm authz:backfill" after starting OpenFGA to sync tuples.');
  }

  // ── 11. Manual HRBP tuple for Anita on Plants BU ──────────────────────────
  // CAVEAT: BusinessUnit has no hrbp_user_id column. The FGA model defines
  // `business_unit.hrbp: [user]`. We write the tuple directly. The nightly
  // reconciler will NOT derive this tuple — it will be removed on the next
  // reconcile run. Re-run `pnpm demo:seed` before each demo to restore it.
  console.log('\n► 11. Manual HRBP FGA tuple — Anita on Plants BU');
  const hrbpTuple = {
    user: userRef(anitaId),
    relation: 'hrbp',
    object: objectRef(FGA_TYPES.businessUnit, buPlantsId),
  };
  try {
    await authzClient.writeTuples([hrbpTuple], []);
    log('fga-tuple', hrbpTuple.object, `hrbp=${anitaId.slice(0, 8)}… (Anita)`);
    console.log('  ⚠  MANUAL TUPLE — not backed by DB column. See HRBP caveat in ws7.md.');
    console.log('     Re-run pnpm demo:seed before each demo to restore this tuple.');
  } catch (err) {
    console.warn('  ⚠  HRBP tuple write failed (FGA not running?):', err instanceof Error ? err.message : String(err));
  }

  // ── 12. Field policy baseline for beat 4 ──────────────────────────────────
  // Seed hrbp/compensation/none so Anita starts with NO compensation access.
  // Beat 4 flips this to 'read' live during the demo.
  console.log('\n► 12. Field policy — hrbp/compensation baseline (none)');
  const [existingFP] = await db
    .select({ id: schema.fieldPolicy.id })
    .from(schema.fieldPolicy)
    .where(
      and(
        eq(schema.fieldPolicy.orgId, orgId),
        eq(schema.fieldPolicy.resource, 'employee'),
        eq(schema.fieldPolicy.fieldGroup, 'compensation'),
        eq(schema.fieldPolicy.relation, 'hrbp')
      )
    )
    .limit(1);

  if (existingFP) {
    await db
      .update(schema.fieldPolicy)
      .set({ access: 'none' })
      .where(eq(schema.fieldPolicy.id, existingFP.id));
    log('field-policy', existingFP.id, 'hrbp/compensation reset to none');
  } else {
    const [fp] = await db
      .insert(schema.fieldPolicy)
      .values({
        orgId,
        resource: 'employee',
        fieldGroup: 'compensation',
        relation: 'hrbp',
        access: 'none',
        createdBy: 'seed-meridian',
        updatedBy: 'seed-meridian',
      })
      .returning({ id: schema.fieldPolicy.id });
    log('field-policy', fp!.id, 'hrbp/compensation=none created');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const ids = {
    orgId, buPlantsId, buCorporateId,
    deptManufacturingId, deptFinanceId,
    teamAssemblyId, teamLogisticsId,
    priyaId, rohanId, saraId, devId, anitaId,
    priyaProfileId, rohanProfileId, saraProfileId, devProfileId, anitaProfileId,
    leaveTypeId, saraLeaveId,
  };

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Seed complete — Meridian Manufacturing  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  org:          ${orgId}`);
  console.log(`  bu:Plants     ${buPlantsId}`);
  console.log(`  bu:Corporate  ${buCorporateId}`);
  console.log(`  dept:MFG      ${deptManufacturingId}`);
  console.log(`  dept:FIN      ${deptFinanceId}`);
  console.log(`  team:Assembly ${teamAssemblyId}`);
  console.log(`  team:Logistics ${teamLogisticsId}`);
  console.log(`  Priya (ADMIN) ${priyaId}`);
  console.log(`  Rohan (MGR)   ${rohanId}`);
  console.log(`  Sara  (USER)  ${saraId}`);
  console.log(`  Dev   (MGR)   ${devId}`);
  console.log(`  Anita (HRBP)  ${anitaId}`);
  console.log(`  Sara leave    ${saraLeaveId}`);
  console.log(`  FGA expected  ${syncResult.expectedCount} tuples`);
  console.log('\nJSON (copy for MERIDIAN_IDS env or .env.demo):');
  console.log(JSON.stringify(ids, null, 2));
}

main()
  .then(() => process.exit(0)) // open DB/FGA pools would otherwise keep Bun alive
  .catch((err) => {
    console.error('\n[seed-meridian] FATAL:', err);
    process.exit(1);
  });
