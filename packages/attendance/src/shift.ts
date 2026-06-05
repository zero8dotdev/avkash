import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db, schema, type Shift, type ShiftAssignment } from '@avkash/db';
import {
  type AuthContext,
  NotFoundError,
  PreconditionFailedError,
  ConflictError,
  ValidationError,
} from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { restMinutes } from './shift-marks';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const DEFAULT_WORKWEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// ── Shift CRUD (ADMIN) ───────────────────────────────────────────────────────
export interface ShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  crossesMidnight?: boolean;
  breakMinutes?: number;
  graceMinutes?: number;
  fullDayHours?: string;
  halfDayHours?: string;
  isFlexible?: boolean;
  minStaff?: number;
}

export async function createShift(ctx: AuthContext, input: ShiftInput): Promise<Shift> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.shift)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      crossesMidnight: input.crossesMidnight ?? false,
      breakMinutes: input.breakMinutes ?? 0,
      graceMinutes: input.graceMinutes ?? 0,
      fullDayHours: input.fullDayHours ?? '8',
      halfDayHours: input.halfDayHours ?? '4',
      isFlexible: input.isFlexible ?? false,
      minStaff: input.minStaff ?? 1,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listShifts(ctx: AuthContext): Promise<Shift[]> {
  requireRole(ctx, 'MANAGER');
  return db.select().from(schema.shift).where(eq(schema.shift.orgId, ctx.orgId));
}

export async function getShift(ctx: AuthContext, id: string): Promise<Shift> {
  const [row] = await db
    .select()
    .from(schema.shift)
    .where(and(eq(schema.shift.id, id), eq(schema.shift.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('SHIFT_NOT_FOUND');
  return row;
}

export async function updateShift(
  ctx: AuthContext,
  id: string,
  patch: Partial<ShiftInput>,
  expectedVersion?: number
): Promise<Shift> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.shift.id, id), eq(schema.shift.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.shift.version, expectedVersion));
  const [row] = await db
    .update(schema.shift)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.startTime !== undefined && { startTime: patch.startTime }),
      ...(patch.endTime !== undefined && { endTime: patch.endTime }),
      ...(patch.crossesMidnight !== undefined && { crossesMidnight: patch.crossesMidnight }),
      ...(patch.breakMinutes !== undefined && { breakMinutes: patch.breakMinutes }),
      ...(patch.graceMinutes !== undefined && { graceMinutes: patch.graceMinutes }),
      ...(patch.fullDayHours !== undefined && { fullDayHours: patch.fullDayHours }),
      ...(patch.halfDayHours !== undefined && { halfDayHours: patch.halfDayHours }),
      ...(patch.isFlexible !== undefined && { isFlexible: patch.isFlexible }),
      ...(patch.minStaff !== undefined && { minStaff: patch.minStaff }),
      version: sql`${schema.shift.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.shift.version })
        .from(schema.shift)
        .where(and(eq(schema.shift.id, id), eq(schema.shift.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('SHIFT_NOT_FOUND');
  }
  return row;
}

// ── Roster (effective-dated assignments) ─────────────────────────────────────
export interface AssignShiftInput {
  userId: string;
  shiftId: string;
  fromDate: string;
  toDate?: string | null;
}

const MIN_REST_MINUTES = 8 * 60;
const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export interface AssignmentIssue {
  code: string;
  detail: Record<string, unknown>;
}
export interface AssignmentValidation {
  conflicts: AssignmentIssue[]; // hard — block unless force
  warnings: AssignmentIssue[]; // soft — inform, don't block
}

// Check an assignment against reality before it lands. Hard conflicts: the person is
// on approved leave, or already assigned a shift in this window. Soft warning: too
// little rest after/before an adjacent shift. The UI calls this as a dry-run while
// building the roster; assignShift runs it too.
export async function validateAssignment(ctx: AuthContext, input: AssignShiftInput): Promise<AssignmentValidation> {
  const conflicts: AssignmentIssue[] = [];
  const warnings: AssignmentIssue[] = [];
  const from = input.fromDate;
  const to = input.toDate ?? input.fromDate;

  const [shift] = await db
    .select()
    .from(schema.shift)
    .where(and(eq(schema.shift.id, input.shiftId), eq(schema.shift.orgId, ctx.orgId)))
    .limit(1);
  if (!shift) throw new NotFoundError('SHIFT_NOT_FOUND');

  // Hard: approved leave overlapping the window.
  const leaves = await db
    .select({ startDate: schema.leave.startDate, endDate: schema.leave.endDate })
    .from(schema.leave)
    .where(
      and(
        eq(schema.leave.userId, input.userId),
        eq(schema.leave.isApproved, 'APPROVED'),
        lte(schema.leave.startDate, to),
        gte(schema.leave.endDate, from)
      )
    );
  if (leaves.length) conflicts.push({ code: 'ON_LEAVE', detail: { leaves } });

  // Hard: an existing assignment overlapping the window (double-booked).
  const overlapping = await db
    .select({
      id: schema.shiftAssignment.id,
      shiftId: schema.shiftAssignment.shiftId,
      fromDate: schema.shiftAssignment.fromDate,
      toDate: schema.shiftAssignment.toDate,
    })
    .from(schema.shiftAssignment)
    .where(
      and(
        eq(schema.shiftAssignment.orgId, ctx.orgId),
        eq(schema.shiftAssignment.userId, input.userId),
        lte(schema.shiftAssignment.fromDate, to),
        or(isNull(schema.shiftAssignment.toDate), gte(schema.shiftAssignment.toDate, from))
      )
    );
  if (overlapping.length) conflicts.push({ code: 'DOUBLE_BOOKED', detail: { assignments: overlapping } });

  // Soft: rest gap against the shift the day before `from` and the day after `to`.
  const prev = await shiftForDate(ctx.orgId, input.userId, addDays(from, -1));
  if (prev) {
    const rest = restMinutes(prev, shift);
    if (rest < MIN_REST_MINUTES)
      warnings.push({ code: 'SHORT_REST', detail: { afterShift: prev.name, restHours: rest / 60 } });
  }
  const next = await shiftForDate(ctx.orgId, input.userId, addDays(to, 1));
  if (next) {
    const rest = restMinutes(shift, next);
    if (rest < MIN_REST_MINUTES)
      warnings.push({ code: 'SHORT_REST', detail: { beforeShift: next.name, restHours: rest / 60 } });
  }

  return { conflicts, warnings };
}

export async function assignShift(ctx: AuthContext, input: AssignShiftInput, force = false): Promise<ShiftAssignment> {
  requireRole(ctx, 'ADMIN');
  const { conflicts, warnings } = await validateAssignment(ctx, input);
  if (conflicts.length && !force) throw new ConflictError('ASSIGNMENT_CONFLICT', { conflicts, warnings });
  const [row] = await db
    .insert(schema.shiftAssignment)
    .values({
      orgId: ctx.orgId,
      userId: input.userId,
      shiftId: input.shiftId,
      fromDate: input.fromDate,
      toDate: input.toDate ?? null,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listAssignments(ctx: AuthContext, userId?: string): Promise<ShiftAssignment[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.shiftAssignment.orgId, ctx.orgId)];
  if (userId) conds.push(eq(schema.shiftAssignment.userId, userId));
  return db
    .select()
    .from(schema.shiftAssignment)
    .where(and(...conds))
    .orderBy(desc(schema.shiftAssignment.fromDate));
}

export async function clearAssignment(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'ADMIN');
  const deleted = await db
    .delete(schema.shiftAssignment)
    .where(and(eq(schema.shiftAssignment.id, id), eq(schema.shiftAssignment.orgId, ctx.orgId)))
    .returning({ id: schema.shiftAssignment.id });
  if (!deleted.length) throw new NotFoundError('ASSIGNMENT_NOT_FOUND');
}

// The effective shift for a user on a date: the roster assignment covering the date
// (latest fromDate wins), else the user's team default, else null (= no shift, so
// present/absent only, no marks). The resolver calls this per day.
export async function shiftForDate(orgId: string, userId: string, dateStr: string): Promise<Shift | null> {
  const [assigned] = await db
    .select({ shiftId: schema.shiftAssignment.shiftId })
    .from(schema.shiftAssignment)
    .where(
      and(
        eq(schema.shiftAssignment.orgId, orgId),
        eq(schema.shiftAssignment.userId, userId),
        lte(schema.shiftAssignment.fromDate, dateStr),
        or(isNull(schema.shiftAssignment.toDate), gte(schema.shiftAssignment.toDate, dateStr))
      )
    )
    .orderBy(desc(schema.shiftAssignment.fromDate))
    .limit(1);

  let shiftId: string | null = assigned?.shiftId ?? null;
  if (!shiftId) {
    const [u] = await db
      .select({ teamId: schema.user.teamId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    if (u?.teamId) {
      const [t] = await db
        .select({ defaultShiftId: schema.team.defaultShiftId })
        .from(schema.team)
        .where(eq(schema.team.teamId, u.teamId))
        .limit(1);
      shiftId = t?.defaultShiftId ?? null;
    }
  }
  if (!shiftId) return null;
  const [s] = await db.select().from(schema.shift).where(eq(schema.shift.id, shiftId)).limit(1);
  return s ?? null;
}

// ── Coverage (the gap view) ──────────────────────────────────────────────────
export interface CoverageCell {
  date: string;
  shiftId: string;
  shiftName: string;
  assigned: number;
  minStaff: number;
  gap: number; // how many short of the target (0 = covered)
}

// For a location over [from,to], how many of its staff are on each shift each day vs
// the shift's minStaff target. gap > 0 = understaffed — the hole to fill before it bites.
export async function coverage(
  ctx: AuthContext,
  locationId: string,
  from: string,
  to: string
): Promise<CoverageCell[]> {
  requireRole(ctx, 'MANAGER');
  const users = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.locationId, locationId)));
  const shifts = await db.select().from(schema.shift).where(eq(schema.shift.orgId, ctx.orgId));

  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);

  const counts = new Map<string, number>(); // `${date}|${shiftId}` → headcount
  for (const date of dates) {
    const resolved = await Promise.all(users.map((u) => shiftForDate(ctx.orgId, u.id, date)));
    for (const s of resolved) if (s) counts.set(`${date}|${s.id}`, (counts.get(`${date}|${s.id}`) ?? 0) + 1);
  }

  const cells: CoverageCell[] = [];
  for (const date of dates) {
    for (const s of shifts) {
      const assigned = counts.get(`${date}|${s.id}`) ?? 0;
      cells.push({
        date,
        shiftId: s.id,
        shiftName: s.name,
        assigned,
        minStaff: s.minStaff,
        gap: Math.max(0, s.minStaff - assigned),
      });
    }
  }
  return cells;
}

// ── Roster generator (the planner that builds the schedule) ──────────────────
export interface GenerateRosterInput {
  userIds?: string[]; // the people to rotate (or derive from a location)
  locationId?: string;
  shiftIds: string[]; // the shifts to rotate them through
  from: string;
  to: string;
  replace?: boolean; // default true — clear in-range day assignments for these users first
}
export interface RosterResult {
  created: number;
  skipped: { userId: string; date: string; reason: string }[]; // ON_LEAVE / WEEKLY_OFF / NO_RESTFUL_SHIFT
  gaps: CoverageCell[]; // shift-days left under minStaff (not enough people)
}

// Build a fair, constraint-aware rotation and persist it. Each person rotates through
// the shifts day to day; a day they're on approved leave or their weekly-off is
// skipped (and resets their rest clock); if the next rotation step would break the
// min-rest gap, the next restful shift is chosen instead. Best-effort on coverage —
// it can't conjure staff, so under-min-staff shift-days are returned as gaps.
export async function generateRoster(ctx: AuthContext, input: GenerateRosterInput): Promise<RosterResult> {
  requireRole(ctx, 'ADMIN');

  let userIds = input.userIds ?? [];
  if (input.locationId) {
    const us = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.locationId, input.locationId)));
    userIds = us.map((u) => u.id);
  }
  userIds = [...new Set(userIds)];
  const shifts = (
    await db
      .select()
      .from(schema.shift)
      .where(and(eq(schema.shift.orgId, ctx.orgId), inArray(schema.shift.id, input.shiftIds)))
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (!userIds.length || !shifts.length)
    throw new ValidationError('ROSTER_INPUT', { users: userIds.length, shifts: shifts.length });

  // effective workweek per user (user → team → default)
  const users = await db
    .select({ id: schema.user.id, workweek: schema.user.workweek, teamId: schema.user.teamId })
    .from(schema.user)
    .where(inArray(schema.user.id, userIds));
  const teamIds = [...new Set(users.map((u) => u.teamId).filter((t): t is string => !!t))];
  const teams = teamIds.length
    ? await db
        .select({ teamId: schema.team.teamId, workweek: schema.team.workweek })
        .from(schema.team)
        .where(inArray(schema.team.teamId, teamIds))
    : [];
  const teamWeek = new Map(teams.map((t) => [t.teamId, (t.workweek ?? null) as string[] | null]));
  const workweekOf = (u: (typeof users)[number]): string[] =>
    u.workweek?.length
      ? (u.workweek as string[])
      : u.teamId
        ? (teamWeek.get(u.teamId) ?? DEFAULT_WORKWEEK)
        : DEFAULT_WORKWEEK;

  // approved leaves overlapping the range
  const leaveRows = await db
    .select({ userId: schema.leave.userId, startDate: schema.leave.startDate, endDate: schema.leave.endDate })
    .from(schema.leave)
    .where(
      and(
        inArray(schema.leave.userId, userIds),
        eq(schema.leave.isApproved, 'APPROVED'),
        lte(schema.leave.startDate, input.to),
        gte(schema.leave.endDate, input.from)
      )
    );
  const leaveByUser = new Map<string, { startDate: string; endDate: string }[]>();
  for (const l of leaveRows) {
    const arr = leaveByUser.get(l.userId) ?? [];
    arr.push(l);
    leaveByUser.set(l.userId, arr);
  }

  if (input.replace !== false) {
    await db
      .delete(schema.shiftAssignment)
      .where(
        and(
          eq(schema.shiftAssignment.orgId, ctx.orgId),
          inArray(schema.shiftAssignment.userId, userIds),
          gte(schema.shiftAssignment.fromDate, input.from),
          lte(schema.shiftAssignment.fromDate, input.to)
        )
      );
  }

  const dates: string[] = [];
  for (let d = input.from; d <= input.to; d = addDays(d, 1)) dates.push(d);
  const N = shifts.length;
  const offset = new Map(userIds.map((id, i) => [id, i % N])); // stagger starting shifts → coverage
  const lastShift = new Map<string, Shift>();
  const skipped: RosterResult['skipped'] = [];
  const toInsert: (typeof schema.shiftAssignment.$inferInsert)[] = [];

  for (let di = 0; di < dates.length; di++) {
    const date = dates[di];
    const weekday = DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
    for (const u of users) {
      if (leaveByUser.get(u.id)?.some((l) => l.startDate <= date && l.endDate >= date)) {
        skipped.push({ userId: u.id, date, reason: 'ON_LEAVE' });
        lastShift.delete(u.id);
        continue;
      }
      if (!workweekOf(u).includes(weekday)) {
        skipped.push({ userId: u.id, date, reason: 'WEEKLY_OFF' });
        lastShift.delete(u.id);
        continue;
      }
      const desired = (offset.get(u.id)! + di) % N;
      let chosen: Shift | null = null;
      for (let k = 0; k < N; k++) {
        const s = shifts[(desired + k) % N];
        const last = lastShift.get(u.id);
        if (last && restMinutes(last, s) < MIN_REST_MINUTES) continue; // rotate past a too-tight pairing
        chosen = s;
        break;
      }
      if (!chosen) {
        skipped.push({ userId: u.id, date, reason: 'NO_RESTFUL_SHIFT' });
        continue;
      }
      toInsert.push({
        orgId: ctx.orgId,
        userId: u.id,
        shiftId: chosen.id,
        fromDate: date,
        toDate: date,
        createdBy: ctx.userId,
      });
      lastShift.set(u.id, chosen);
    }
  }
  if (toInsert.length) await db.insert(schema.shiftAssignment).values(toInsert);

  // gaps in the generated plan
  const counts = new Map<string, number>();
  for (const a of toInsert)
    counts.set(`${a.fromDate}|${a.shiftId}`, (counts.get(`${a.fromDate}|${a.shiftId}`) ?? 0) + 1);
  const gaps: CoverageCell[] = [];
  for (const date of dates) {
    for (const s of shifts) {
      const assigned = counts.get(`${date}|${s.id}`) ?? 0;
      if (assigned < s.minStaff)
        gaps.push({
          date,
          shiftId: s.id,
          shiftName: s.name,
          assigned,
          minStaff: s.minStaff,
          gap: s.minStaff - assigned,
        });
    }
  }
  return { created: toInsert.length, skipped, gaps };
}
