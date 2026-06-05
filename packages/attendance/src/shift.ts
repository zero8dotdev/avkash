import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db, schema, type Shift, type ShiftAssignment } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError, ConflictError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { restMinutes } from './shift-marks';

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
