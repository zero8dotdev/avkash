import { and, eq, sql } from 'drizzle-orm';
import { db, schema, type OrgLevel } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export interface CreateOrgLevelInput {
  name: string;
  code: string;
  description?: string | null;
  rank: number;
  isFloating?: boolean;
}

export interface UpdateOrgLevelInput {
  name?: string;
  code?: string;
  description?: string | null;
  rank?: number;
  isFloating?: boolean;
}

export async function createOrgLevel(ctx: AuthContext, input: CreateOrgLevelInput): Promise<OrgLevel> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.orgLevel)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      rank: input.rank,
      isFloating: input.isFloating ?? false,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listOrgLevels(ctx: AuthContext, includeInactive = false): Promise<OrgLevel[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.orgLevel.orgId, ctx.orgId)];
  if (!includeInactive) conds.push(eq(schema.orgLevel.isActive, true));
  return db.select().from(schema.orgLevel).where(and(...conds)).orderBy(schema.orgLevel.rank);
}

export async function getOrgLevel(ctx: AuthContext, id: string): Promise<OrgLevel> {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.orgLevel)
    .where(and(eq(schema.orgLevel.id, id), eq(schema.orgLevel.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('ORG_LEVEL_NOT_FOUND');
  return row;
}

export async function updateOrgLevel(
  ctx: AuthContext,
  id: string,
  patch: UpdateOrgLevelInput,
  expectedVersion?: number
): Promise<OrgLevel> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.orgLevel.id, id), eq(schema.orgLevel.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.orgLevel.version, expectedVersion));
  const [row] = await db
    .update(schema.orgLevel)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.code !== undefined && { code: patch.code.toUpperCase() }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.rank !== undefined && { rank: patch.rank }),
      ...(patch.isFloating !== undefined && { isFloating: patch.isFloating }),
      version: sql`${schema.orgLevel.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.orgLevel.version })
        .from(schema.orgLevel)
        .where(and(eq(schema.orgLevel.id, id), eq(schema.orgLevel.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('ORG_LEVEL_NOT_FOUND');
  }
  return row;
}

export async function archiveOrgLevel(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.orgLevel)
    .set({ isActive: false, version: sql`${schema.orgLevel.version} + 1`, updatedBy: ctx.userId, updatedAt: new Date() })
    .where(and(eq(schema.orgLevel.id, id), eq(schema.orgLevel.orgId, ctx.orgId)));
}
