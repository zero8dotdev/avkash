import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema, type BusinessUnit } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError, ORG_GRAPH_EVENTS } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { publish, defineEvent } from '@avkash/events';

// ── Event definitions ────────────────
const businessUnitChangedDef = defineEvent(
  ORG_GRAPH_EVENTS.BUSINESS_UNIT_CHANGED,
  z.object({ orgId: z.string().uuid(), businessUnitId: z.string().uuid() })
);

export interface CreateBusinessUnitInput {
  name: string;
  legalName?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export interface UpdateBusinessUnitInput {
  name?: string;
  legalName?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export async function createBusinessUnit(ctx: AuthContext, input: CreateBusinessUnitInput): Promise<BusinessUnit> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.businessUnit)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      legalName: input.legalName ?? null,
      logoUrl: input.logoUrl ?? null,
      brandColor: input.brandColor ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  // Emit BU changed event. No transaction — best-effort post-write.
  try {
    await publish(db, ctx, businessUnitChangedDef, { orgId: ctx.orgId, businessUnitId: row.id });
  } catch (err) {
    console.error('[authz-sync] publish org.business_unit.changed (create) failed:', err instanceof Error ? err.message : err);
  }
  return row;
}

export async function listBusinessUnits(ctx: AuthContext): Promise<BusinessUnit[]> {
  requireRole(ctx, 'ADMIN');
  return db.select().from(schema.businessUnit).where(eq(schema.businessUnit.orgId, ctx.orgId));
}

export async function getBusinessUnit(ctx: AuthContext, id: string): Promise<BusinessUnit> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .select()
    .from(schema.businessUnit)
    .where(and(eq(schema.businessUnit.id, id), eq(schema.businessUnit.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('BUSINESS_UNIT_NOT_FOUND');
  return row;
}

export async function updateBusinessUnit(
  ctx: AuthContext,
  id: string,
  patch: UpdateBusinessUnitInput,
  expectedVersion?: number
): Promise<BusinessUnit> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.businessUnit.id, id), eq(schema.businessUnit.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.businessUnit.version, expectedVersion));
  const [row] = await db
    .update(schema.businessUnit)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.legalName !== undefined && { legalName: patch.legalName }),
      ...(patch.logoUrl !== undefined && { logoUrl: patch.logoUrl }),
      ...(patch.brandColor !== undefined && { brandColor: patch.brandColor }),
      version: sql`${schema.businessUnit.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.businessUnit.version })
        .from(schema.businessUnit)
        .where(and(eq(schema.businessUnit.id, id), eq(schema.businessUnit.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('BUSINESS_UNIT_NOT_FOUND');
  }
  // Emit BU changed event. No transaction — best-effort post-write.
  try {
    await publish(db, ctx, businessUnitChangedDef, { orgId: ctx.orgId, businessUnitId: id });
  } catch (err) {
    console.error('[authz-sync] publish org.business_unit.changed (update) failed:', err instanceof Error ? err.message : err);
  }
  return row;
}

export async function archiveBusinessUnit(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.businessUnit)
    .set({ isActive: false, version: sql`${schema.businessUnit.version} + 1`, updatedBy: ctx.userId, updatedAt: new Date() })
    .where(and(eq(schema.businessUnit.id, id), eq(schema.businessUnit.orgId, ctx.orgId)));
}

// Pure helper used by document generation / email templates.
// Returns the business unit's brand fields when set, else falls back to org fields.
export function resolveOrgBrand(
  org: { name: string | null; legalName?: string | null },
  businessUnit?: { name: string; legalName?: string | null; logoUrl?: string | null; brandColor?: string | null } | null
): { name: string; legalName: string | null; logoUrl: string | null; brandColor: string | null } {
  if (businessUnit) {
    return {
      name: businessUnit.name,
      legalName: businessUnit.legalName ?? null,
      logoUrl: businessUnit.logoUrl ?? null,
      brandColor: businessUnit.brandColor ?? null,
    };
  }
  return { name: org.name ?? '', legalName: (org as { legalName?: string | null }).legalName ?? null, logoUrl: null, brandColor: null };
}
