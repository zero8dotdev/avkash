// Scenario test helpers. Each test file creates its own org (isolated by orgId)
// and tears down via cascade delete in afterAll. No mocks — real Postgres.
//
// DATABASE_URL must point at the dev/test DB (same as db:push uses).

import { db, schema } from '@avkash/db';
import { eq } from 'drizzle-orm';
import type { AuthContext } from '@avkash/shared';

// ─── Auth context factories ──────────────────────────────────────────────────

export function adminCtx(orgId: string, userId: string): AuthContext {
  return { orgId, userId, role: 'ADMIN', actorType: 'user', assurance: 'medium', via: 'system' };
}
export function managerCtx(orgId: string, userId: string): AuthContext {
  return { orgId, userId, role: 'MANAGER', actorType: 'user', assurance: 'medium', via: 'system' };
}
export function userCtx(orgId: string, userId: string): AuthContext {
  return { orgId, userId, role: 'USER', actorType: 'user', assurance: 'medium', via: 'system' };
}

// ─── Org scaffold ────────────────────────────────────────────────────────────

export interface OrgFixture {
  orgId: string;
  // Locations
  loc: {
    hq: string;
    pune: string;
    nashik: string;
    silvassa: string; // SEZ
    pithampur: string;
  };
  // Business Units
  bu: { auto: string; pack: string; export: string };
  // OrgLevels (by code)
  level: {
    dir: string; gm: string; dgm: string; mgr: string; am: string;
    sup: string; tech: string; opr: string; hlp1: string; hlp2: string;
  };
  // Teams (leave-policy units)
  team: {
    leadership: string;
    corporate: string;
    marketing: string;
    sales: string;
    puneSup: string;
    puneWorkers: string;
    nashikWorkers: string;
    silvassaWorkers: string;
    pithampurWorkers: string;
  };
  // Shifts
  shift: { general: string; a: string; b: string; c: string };
  // Leave types
  lt: { el: string; cl: string; sl: string };
}

// Builds the complete Mahalaxmi org structure. Returns all IDs for use in scenarios.
export async function createMahalaxmiOrg(): Promise<OrgFixture> {
  // ── Organisation ──────────────────────────────────────────────────────────
  const [org] = await db
    .insert(schema.organisation)
    .values({
      status: 'VERIFIED',
      isSetupCompleted: true,
      halfDayLeave: true,
      escalateAfterDays: 3,
      createdBy: 'seed',
    })
    .returning({ orgId: schema.organisation.orgId });
  const orgId = org!.orgId;

  // ── Locations ─────────────────────────────────────────────────────────────
  const locs = await db
    .insert(schema.location)
    .values([
      {
        orgId, name: 'Corporate HQ', timezone: 'Asia/Kolkata',
        address: 'Hinjewadi Phase 2, Pune, MH 411057',
        laborRegime: 'STANDARD', overtimeThresholdHours: '9',
      },
      {
        orgId, name: 'Pune MIDC Plant', timezone: 'Asia/Kolkata',
        address: 'Plot 42, MIDC Bhosari, Pune, MH 411026',
        laborRegime: 'STANDARD', overtimeThresholdHours: '9',
      },
      {
        orgId, name: 'Nashik Plant', timezone: 'Asia/Kolkata',
        address: 'MIDC Satpur, Nashik, MH 422007',
        laborRegime: 'STANDARD', overtimeThresholdHours: '9',
      },
      {
        orgId, name: 'Silvassa SEZ Plant', timezone: 'Asia/Kolkata',
        address: 'SEZ, Silvassa, DN & DD 396230',
        laborRegime: 'SEZ', overtimeThresholdHours: '10',
      },
      {
        orgId, name: 'Pithampur Plant', timezone: 'Asia/Kolkata',
        address: 'SEZ Phase II, Pithampur, MP 454775',
        laborRegime: 'SHOP_ESTABLISHMENT', overtimeThresholdHours: '9',
      },
    ])
    .returning({ id: schema.location.id });
  const [locHq, locPune, locNashik, locSilvassa, locPith] = locs as [
    { id: string }, { id: string }, { id: string }, { id: string }, { id: string }
  ];

  // ── Business Units ─────────────────────────────────────────────────────────
  const bus = await db
    .insert(schema.businessUnit)
    .values([
      { orgId, name: 'Automotive Components', legalName: 'Mahalaxmi Auto Parts Div.', brandColor: '1E3A8A', createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Industrial Packaging', legalName: 'Mahalaxmi Packtech Div.', brandColor: '065F46', createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Silvassa SEZ Plant', legalName: 'Mahalaxmi Exports', brandColor: '92400E', createdBy: 'seed', updatedBy: 'seed' },
    ])
    .returning({ id: schema.businessUnit.id });
  const [buAuto, buPack, buExport] = bus as [{ id: string }, { id: string }, { id: string }];

  // ── OrgLevels ──────────────────────────────────────────────────────────────
  const levels = await db
    .insert(schema.orgLevel)
    .values([
      { orgId, name: 'Director',               code: 'DIR',  rank: 100, isFloating: true,  requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'General Manager',         code: 'GM',   rank: 80,  isFloating: true,  requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Deputy General Manager',  code: 'DGM',  rank: 65,  isFloating: false, requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Manager',                 code: 'MGR',  rank: 50,  isFloating: false, requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Asst. Manager/Officer',   code: 'AM',   rank: 40,  isFloating: false, requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Supervisor/Foreman',      code: 'SUP',  rank: 30,  isFloating: false, requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Technician/ITI',          code: 'TECH', rank: 20,  isFloating: false, requiresPunchConfirmation: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Machine Operator',        code: 'OPR',  rank: 15,  isFloating: false, requiresPunchConfirmation: true,  createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Helper Gr. I',            code: 'HLP1', rank: 10,  isFloating: false, requiresPunchConfirmation: true,  createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Helper Gr. II',           code: 'HLP2', rank: 5,   isFloating: false, requiresPunchConfirmation: true,  createdBy: 'seed', updatedBy: 'seed' },
    ])
    .returning({ id: schema.orgLevel.id });
  const [lvlDir, lvlGm, lvlDgm, lvlMgr, lvlAm, lvlSup, lvlTech, lvlOpr, lvlHlp1, lvlHlp2] = levels as Array<{ id: string }>;

  // ── Teams ─────────────────────────────────────────────────────────────────
  type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  const WD_5: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const WD_6: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const teams = await db
    .insert(schema.team)
    .values([
      { orgId, name: 'Senior Leadership',       locationId: locHq!.id,      workweek: WD_5, createdBy: 'seed' },
      { orgId, name: 'Corporate White Collar',  locationId: locHq!.id,      workweek: WD_5, createdBy: 'seed' },
      { orgId, name: 'Marketing',               locationId: locHq!.id,      workweek: WD_5, createdBy: 'seed' },
      { orgId, name: 'Sales & BD',              locationId: locHq!.id,      workweek: WD_5, createdBy: 'seed' },
      { orgId, name: 'Pune MIDC — Supervisors', locationId: locPune!.id,    workweek: WD_6, createdBy: 'seed' },
      { orgId, name: 'Pune MIDC — Workers',     locationId: locPune!.id,    workweek: WD_6, createdBy: 'seed' },
      { orgId, name: 'Nashik — Workers',        locationId: locNashik!.id,  workweek: WD_6, createdBy: 'seed' },
      { orgId, name: 'Silvassa SEZ — Workers',  locationId: locSilvassa!.id, workweek: WD_6, createdBy: 'seed' },
      { orgId, name: 'Pithampur — Workers',     locationId: locPith!.id,    workweek: WD_6, createdBy: 'seed' },
    ])
    .returning({ teamId: schema.team.teamId });
  const [tLeadership, tCorporate, tMarketing, tSales, tPuneSup, tPuneW, tNashikW, tSilvassaW, tPithW] = teams as Array<{ teamId: string }>;

  // ── Shifts ────────────────────────────────────────────────────────────────
  const shifts = await db
    .insert(schema.shift)
    .values([
      {
        orgId, name: 'General Shift', startTime: '09:30', endTime: '18:30',
        crossesMidnight: false, graceMinutes: 15, breakMinutes: 60,
        fullDayHours: '9', halfDayHours: '4.5', isFlexible: false,
        trackOvertime: false, minStaff: 0, createdBy: 'seed', updatedBy: 'seed',
      },
      {
        orgId, name: 'A Shift (Morning)', startTime: '06:00', endTime: '14:00',
        crossesMidnight: false, graceMinutes: 10, breakMinutes: 30,
        fullDayHours: '8', halfDayHours: '4', isFlexible: false,
        trackOvertime: true, minStaff: 10, createdBy: 'seed', updatedBy: 'seed',
      },
      {
        orgId, name: 'B Shift (Afternoon)', startTime: '14:00', endTime: '22:00',
        crossesMidnight: false, graceMinutes: 10, breakMinutes: 30,
        fullDayHours: '8', halfDayHours: '4', isFlexible: false,
        trackOvertime: true, minStaff: 10, createdBy: 'seed', updatedBy: 'seed',
      },
      {
        orgId, name: 'C Shift (Night)', startTime: '22:00', endTime: '06:00',
        crossesMidnight: true, graceMinutes: 10, breakMinutes: 30,
        fullDayHours: '8', halfDayHours: '4', isFlexible: false,
        trackOvertime: true, allowedGenders: ['MALE'], // SEZ: no female night shift
        minStaff: 8, createdBy: 'seed', updatedBy: 'seed',
      },
    ])
    .returning({ id: schema.shift.id });
  const [shGeneral, shA, shB, shC] = shifts as Array<{ id: string }>;

  // ── Leave Types ───────────────────────────────────────────────────────────
  const lts = await db
    .insert(schema.leaveType)
    .values([
      { orgId, name: 'Earned Leave', kind: 'LEAVE', isPaid: true, setSlackStatus: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Casual Leave', kind: 'LEAVE', isPaid: true, setSlackStatus: false, createdBy: 'seed', updatedBy: 'seed' },
      { orgId, name: 'Sick Leave',   kind: 'LEAVE', isPaid: true, setSlackStatus: false, createdBy: 'seed', updatedBy: 'seed' },
    ])
    .returning({ leaveTypeId: schema.leaveType.leaveTypeId });
  const [ltEl, ltCl, ltSl] = lts as Array<{ leaveTypeId: string }>;

  // ── Leave Policies (EL per team) ──────────────────────────────────────────
  // Build a uniform array — give every row the same optional fields (null = inherit base).
  const elPolicyBase = {
    orgId, leaveTypeId: ltEl!.leaveTypeId,
    accruals: true, accrualFrequency: 'MONTHLY' as const, accrueOn: 'BEGINNING' as const,
    encashable: true, isActive: true,
    probationMaxLeaves: null as null | number, probationAccruals: null as null | boolean,
    createdBy: 'seed', updatedBy: 'seed',
  };
  await db.insert(schema.leavePolicy).values([
    {
      ...elPolicyBase, teamId: tLeadership!.teamId,
      maxLeaves: 30, rollOver: true, rollOverLimit: 60,
    },
    {
      ...elPolicyBase, teamId: tCorporate!.teamId,
      maxLeaves: 18, rollOver: true, rollOverLimit: 36,
    },
    {
      ...elPolicyBase, teamId: tPuneW!.teamId,
      maxLeaves: 15, rollOver: false,
      probationMaxLeaves: 0, probationAccruals: false,
    },
    {
      ...elPolicyBase, teamId: tNashikW!.teamId,
      maxLeaves: 15, rollOver: false,
      probationMaxLeaves: 0, probationAccruals: false,
    },
    {
      ...elPolicyBase, teamId: tSilvassaW!.teamId,
      maxLeaves: 15, rollOver: false,
      probationMaxLeaves: 0, probationAccruals: false,
    },
  ]);

  return {
    orgId,
    loc:   { hq: locHq!.id, pune: locPune!.id, nashik: locNashik!.id, silvassa: locSilvassa!.id, pithampur: locPith!.id },
    bu:    { auto: buAuto!.id, pack: buPack!.id, export: buExport!.id },
    level: {
      dir: lvlDir!.id, gm: lvlGm!.id, dgm: lvlDgm!.id, mgr: lvlMgr!.id, am: lvlAm!.id,
      sup: lvlSup!.id, tech: lvlTech!.id, opr: lvlOpr!.id, hlp1: lvlHlp1!.id, hlp2: lvlHlp2!.id,
    },
    team:  {
      leadership: tLeadership!.teamId, corporate: tCorporate!.teamId,
      marketing: tMarketing!.teamId, sales: tSales!.teamId,
      puneSup: tPuneSup!.teamId, puneWorkers: tPuneW!.teamId,
      nashikWorkers: tNashikW!.teamId, silvassaWorkers: tSilvassaW!.teamId,
      pithampurWorkers: tPithW!.teamId,
    },
    shift: { general: shGeneral!.id, a: shA!.id, b: shB!.id, c: shC!.id },
    lt:    { el: ltEl!.leaveTypeId, cl: ltCl!.leaveTypeId, sl: ltSl!.leaveTypeId },
  };
}

// ─── User / Employee helpers ─────────────────────────────────────────────────

let _emailSeq = 0;
function uniqEmail(prefix: string, orgId: string) {
  return `${prefix}.${orgId.slice(0, 8)}.${++_emailSeq}@test.mahalaxmi.local`;
}

export interface TestEmployee {
  userId: string;
  profileId: string;
}

export async function createEmployee(
  orgId: string,
  opts: {
    name: string;
    role?: 'ADMIN' | 'MANAGER' | 'USER';
    teamId?: string;
    levelId?: string;
    locationId?: string;
    employmentStatus?: 'ACTIVE' | 'PROBATION';
    probationEndsOn?: string; // YYYY-MM-DD
    joinedOn?: string;
  }
): Promise<TestEmployee> {
  const [u] = await db
    .insert(schema.user)
    .values({
      name: opts.name,
      email: uniqEmail(opts.name.replace(/\s+/g, '.').toLowerCase(), orgId),
      emailVerified: true,
      role: opts.role ?? 'USER',
      orgId,
      teamId: opts.teamId ?? null,
      locationId: opts.locationId ?? null,
      joinedOn: opts.joinedOn ?? new Date().toISOString().slice(0, 10),
    })
    .returning({ id: schema.user.id });

  const [p] = await db
    .insert(schema.employeeProfile)
    .values({
      userId: u!.id,
      orgId,
      employmentStatus: opts.employmentStatus ?? 'ACTIVE',
      levelId: opts.levelId ?? null,
      probationEndsOn: opts.probationEndsOn ?? null,
      createdBy: 'seed',
      updatedBy: 'seed',
    })
    .returning({ id: schema.employeeProfile.id });

  return { userId: u!.id, profileId: p!.id };
}

// Punch a record directly (bypasses assertSourceAllowed for scenario simplicity).
export async function insertPunch(
  orgId: string,
  userId: string,
  opts: {
    type: 'IN' | 'OUT';
    ts: Date;
    source?: 'WEB' | 'DEVICE';
    deviceId?: string;
    confirmationStatus?: 'PENDING_CONFIRMATION' | 'CONFIRMED' | null;
    wfh?: boolean;
  }
) {
  const [row] = await db
    .insert(schema.attendancePunch)
    .values({
      orgId,
      userId,
      ts: opts.ts,
      type: opts.type,
      source: opts.source ?? 'DEVICE',
      deviceId: opts.deviceId ?? null,
      wfh: opts.wfh ?? false,
      confirmationStatus: opts.confirmationStatus ?? null,
      createdBy: 'seed',
    })
    .returning();
  return row!;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

// Cascade-delete the test org. All child tables have FK → organisation.orgId
// so Postgres handles it.
export async function cleanupOrg(orgId: string) {
  await db.delete(schema.organisation).where(eq(schema.organisation.orgId, orgId));
}
