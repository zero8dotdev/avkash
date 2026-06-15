import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export interface ShiftSupervisorInput {
  userId: string;
  shiftId: string;
  locationId: string;
  departmentId?: string | null;
}

export interface SupervisorScope {
  shiftId: string;
  locationId: string;
  departmentId: string | null;
}

export async function assignShiftSupervisor(ctx: AuthContext, input: ShiftSupervisorInput) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.shiftSupervisor)
    .values({
      orgId: ctx.orgId,
      userId: input.userId,
      shiftId: input.shiftId,
      locationId: input.locationId,
      departmentId: input.departmentId ?? null,
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [
        schema.shiftSupervisor.orgId,
        schema.shiftSupervisor.userId,
        schema.shiftSupervisor.shiftId,
        schema.shiftSupervisor.locationId,
      ],
      set: { isActive: true, departmentId: input.departmentId ?? null },
    })
    .returning();
  return row;
}

export async function removeShiftSupervisor(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.shiftSupervisor)
    .set({ isActive: false })
    .where(and(eq(schema.shiftSupervisor.id, id), eq(schema.shiftSupervisor.orgId, ctx.orgId)))
    .returning();
  if (!row) throw new NotFoundError('SHIFT_SUPERVISOR_NOT_FOUND');
}

export async function listShiftSupervisors(
  ctx: AuthContext,
  opts?: { shiftId?: string; locationId?: string }
) {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.shiftSupervisor.orgId, ctx.orgId), eq(schema.shiftSupervisor.isActive, true)];
  if (opts?.shiftId) conds.push(eq(schema.shiftSupervisor.shiftId, opts.shiftId));
  if (opts?.locationId) conds.push(eq(schema.shiftSupervisor.locationId, opts.locationId));
  return db
    .select()
    .from(schema.shiftSupervisor)
    .where(and(...conds));
}

// Predicate: is the calling user a supervisor for this shift × location?
// If departmentId is provided, also matches assignments scoped to that dept or null (all depts).
export async function isShiftSupervisor(
  ctx: AuthContext,
  shiftId: string,
  locationId: string,
  departmentId?: string
): Promise<boolean> {
  if (!ctx.userId) return false;
  const conds = [
    eq(schema.shiftSupervisor.orgId, ctx.orgId),
    eq(schema.shiftSupervisor.userId, ctx.userId),
    eq(schema.shiftSupervisor.shiftId, shiftId),
    eq(schema.shiftSupervisor.locationId, locationId),
    eq(schema.shiftSupervisor.isActive, true),
  ];
  const rows = await db.select({ id: schema.shiftSupervisor.id, departmentId: schema.shiftSupervisor.departmentId })
    .from(schema.shiftSupervisor)
    .where(and(...conds));
  if (!rows.length) return false;
  // If departmentId given, match rows that are null (all depts) or match exactly.
  if (departmentId) return rows.some((r) => r.departmentId === null || r.departmentId === departmentId);
  return true;
}

// Returns all supervisor scopes for the calling user (used in muster queries).
export async function supervisorScope(ctx: AuthContext): Promise<SupervisorScope[]> {
  if (!ctx.userId) return [];
  const rows = await db
    .select({
      shiftId: schema.shiftSupervisor.shiftId,
      locationId: schema.shiftSupervisor.locationId,
      departmentId: schema.shiftSupervisor.departmentId,
    })
    .from(schema.shiftSupervisor)
    .where(
      and(
        eq(schema.shiftSupervisor.orgId, ctx.orgId),
        eq(schema.shiftSupervisor.userId, ctx.userId),
        eq(schema.shiftSupervisor.isActive, true)
      )
    );
  return rows.map((r) => ({ shiftId: r.shiftId, locationId: r.locationId, departmentId: r.departmentId }));
}

// Guard: throws if caller is not a manager AND not a supervisor for the given shift × location.
export async function requireShiftAccess(
  ctx: AuthContext,
  shiftId: string,
  locationId: string,
  departmentId?: string
) {
  try {
    requireRole(ctx, 'MANAGER');
    return; // MANAGER or above → OK
  } catch {
    if (await isShiftSupervisor(ctx, shiftId, locationId, departmentId)) return;
    throw new ForbiddenError('NOT_SHIFT_SUPERVISOR');
  }
}
