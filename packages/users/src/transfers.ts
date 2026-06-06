import { and, eq, lte, sql, desc } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, BusinessRuleError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
export { effectiveLocation, effectiveDepartment } from './transfers-pure';
export type { ActiveTransfer } from './transfers-pure';
import { effectiveLocation } from './transfers-pure';

export type TransferInput = {
  userId: string;
  fromLocationId: string;
  toLocationId: string;
  fromDepartmentId?: string | null;
  toDepartmentId?: string | null;
  type: 'TEMPORARY' | 'PERMANENT';
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  letterUrl?: string | null;
};

// Fetch active transfers for a user on a given date.
async function getActiveTransfers(orgId: string, userId: string, date: string) {
  return db
    .select()
    .from(schema.transfer)
    .where(
      and(
        eq(schema.transfer.orgId, orgId),
        eq(schema.transfer.userId, userId),
        eq(schema.transfer.status, 'ACTIVE'),
        lte(schema.transfer.startDate, date),
        // open-ended (permanent) OR end date not yet passed
      )
    );
}

// Resolve effective location for attendance and leave calculations.
export async function resolveEffectiveLocation(orgId: string, userId: string, date: string): Promise<string | null> {
  const [usr] = await db
    .select({ locationId: schema.user.locationId })
    .from(schema.user)
    .where(and(eq(schema.user.id, userId), eq(schema.user.orgId, orgId)))
    .limit(1);
  if (!usr) return null;

  const transfers = await getActiveTransfers(orgId, userId, date);
  const filtered = transfers.filter((t) => t.endDate == null || t.endDate >= date);
  return effectiveLocation(filtered, usr.locationId ?? '', date) || null;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function initiateTransfer(ctx: AuthContext, input: TransferInput) {
  requireRole(ctx, 'ADMIN');
  if (input.fromLocationId === input.toLocationId) {
    throw new BusinessRuleError('TRANSFER_SAME_LOCATION', { locationId: input.fromLocationId });
  }
  if (input.type === 'TEMPORARY' && !input.endDate) {
    throw new BusinessRuleError('TEMPORARY_TRANSFER_NEEDS_END_DATE', {});
  }
  const [row] = await db
    .insert(schema.transfer)
    .values({
      orgId: ctx.orgId,
      userId: input.userId,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      fromDepartmentId: input.fromDepartmentId ?? null,
      toDepartmentId: input.toDepartmentId ?? null,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      status: 'PENDING',
      notes: input.notes ?? null,
      letterUrl: input.letterUrl ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function approveTransfer(ctx: AuthContext, transferId: string) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.transfer)
    .set({
      status: 'ACTIVE',
      authorizedBy: ctx.userId,
      version: sql`${schema.transfer.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.transfer.id, transferId), eq(schema.transfer.orgId, ctx.orgId), eq(schema.transfer.status, 'PENDING')))
    .returning();
  if (!row) throw new NotFoundError('TRANSFER_NOT_FOUND');
  return row;
}

export async function cancelTransfer(ctx: AuthContext, transferId: string) {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.transfer)
    .set({
      status: 'CANCELLED',
      version: sql`${schema.transfer.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.transfer.id, transferId),
        eq(schema.transfer.orgId, ctx.orgId),
      )
    );
}

export async function listTransfers(ctx: AuthContext, userId?: string) {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.transfer.orgId, ctx.orgId)];
  if (userId) conds.push(eq(schema.transfer.userId, userId));
  return db.select().from(schema.transfer).where(and(...conds)).orderBy(desc(schema.transfer.startDate));
}

export async function getTransfer(ctx: AuthContext, id: string) {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.transfer)
    .where(and(eq(schema.transfer.id, id), eq(schema.transfer.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('TRANSFER_NOT_FOUND');
  return row;
}

// Sweep: mark ACTIVE temporary transfers as COMPLETED when endDate < today.
// Called by a daily cron job in @avkash/jobs.
export async function sweepExpiredTransfers(orgId: string, today: string): Promise<number> {
  const result = await db
    .update(schema.transfer)
    .set({ status: 'COMPLETED', updatedAt: new Date() })
    .where(
      and(
        eq(schema.transfer.orgId, orgId),
        eq(schema.transfer.status, 'ACTIVE'),
        eq(schema.transfer.type, 'TEMPORARY'),
        lte(schema.transfer.endDate, today)
      )
    )
    .returning({ id: schema.transfer.id });
  return result.length;
}
