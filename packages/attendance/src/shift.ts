import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db, schema, type Shift, type ShiftAssignment } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

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

export async function assignShift(ctx: AuthContext, input: AssignShiftInput): Promise<ShiftAssignment> {
  requireRole(ctx, 'ADMIN');
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
