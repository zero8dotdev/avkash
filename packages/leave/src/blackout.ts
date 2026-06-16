import { and, eq, isNull, lte, gte, or } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, BusinessRuleError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export type BlackoutInput = {
  name: string;
  startDate: string;
  endDate: string;
  leaveTypeId?: string | null;
  locationId?: string | null;
};

export async function createBlackout(ctx: AuthContext, input: BlackoutInput) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.leaveBlackout)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      leaveTypeId: input.leaveTypeId ?? null,
      locationId: input.locationId ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listBlackouts(ctx: AuthContext, opts?: { locationId?: string }) {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.leaveBlackout.orgId, ctx.orgId), eq(schema.leaveBlackout.isActive, true)];
  if (opts?.locationId) {
    conds.push(or(isNull(schema.leaveBlackout.locationId), eq(schema.leaveBlackout.locationId, opts.locationId))!);
  }
  return db
    .select()
    .from(schema.leaveBlackout)
    .where(and(...conds));
}

export async function updateBlackout(ctx: AuthContext, id: string, patch: Partial<BlackoutInput>) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.leaveBlackout)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.startDate !== undefined && { startDate: patch.startDate }),
      ...(patch.endDate !== undefined && { endDate: patch.endDate }),
      ...(patch.leaveTypeId !== undefined && { leaveTypeId: patch.leaveTypeId }),
      ...(patch.locationId !== undefined && { locationId: patch.locationId }),
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.leaveBlackout.id, id), eq(schema.leaveBlackout.orgId, ctx.orgId)))
    .returning();
  if (!row) throw new NotFoundError('BLACKOUT_NOT_FOUND');
  return row;
}

export async function deleteBlackout(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.leaveBlackout)
    .set({ isActive: false, updatedBy: ctx.userId, updatedAt: new Date() })
    .where(and(eq(schema.leaveBlackout.id, id), eq(schema.leaveBlackout.orgId, ctx.orgId)));
}

// Guard called from applyLeave: throws if the date range overlaps an active blackout.
// `leaveTypeId = null` blackouts block ALL leave types.
export async function assertNoBlackout(
  orgId: string,
  _userId: string,
  startDate: string,
  endDate: string,
  leaveTypeId: string,
  locationId?: string | null
): Promise<void> {
  const conds = [
    eq(schema.leaveBlackout.orgId, orgId),
    eq(schema.leaveBlackout.isActive, true),
    lte(schema.leaveBlackout.startDate, endDate),
    gte(schema.leaveBlackout.endDate, startDate),
    or(isNull(schema.leaveBlackout.leaveTypeId), eq(schema.leaveBlackout.leaveTypeId, leaveTypeId))!,
  ];

  if (locationId) {
    conds.push(or(isNull(schema.leaveBlackout.locationId), eq(schema.leaveBlackout.locationId, locationId))!);
  }

  const [hit] = await db
    .select({ id: schema.leaveBlackout.id, name: schema.leaveBlackout.name })
    .from(schema.leaveBlackout)
    .where(and(...conds))
    .limit(1);

  if (hit) {
    throw new BusinessRuleError('LEAVE_BLACKOUT_PERIOD', { blackoutId: hit.id, name: hit.name, startDate, endDate });
  }
}
