import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError, ConflictError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
export { effectiveWorkdays, isWorkday, countWorkdays, cycleWeekIndex } from './workweek-pure';
export type { WorkweekPatternRecord } from './workweek-pure';

export type WorkweekPatternInput = {
  name: string;
  cycleLength: number;
  weeks: string[][];
  referenceDate: string;
};

const VALID_DAYS = new Set(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);

function validatePattern(input: WorkweekPatternInput): void {
  if (input.cycleLength < 1 || input.cycleLength > 52) {
    throw new ConflictError('INVALID_CYCLE_LENGTH', { cycleLength: input.cycleLength });
  }
  if (input.weeks.length !== input.cycleLength) {
    throw new ConflictError('WEEKS_CYCLE_MISMATCH', { expected: input.cycleLength, got: input.weeks.length });
  }
  for (const week of input.weeks) {
    for (const day of week) {
      if (!VALID_DAYS.has(day)) {
        throw new ConflictError('INVALID_DAY_NAME', { day });
      }
    }
  }
}

export async function createWorkweekPattern(ctx: AuthContext, input: WorkweekPatternInput) {
  requireRole(ctx, 'ADMIN');
  validatePattern(input);
  const [row] = await db
    .insert(schema.workweekPattern)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      cycleLength: input.cycleLength,
      weeks: input.weeks,
      referenceDate: input.referenceDate,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listWorkweekPatterns(ctx: AuthContext) {
  requireRole(ctx, 'MANAGER');
  return db
    .select()
    .from(schema.workweekPattern)
    .where(and(eq(schema.workweekPattern.orgId, ctx.orgId), eq(schema.workweekPattern.isActive, true)));
}

export async function getWorkweekPattern(ctx: AuthContext, id: string) {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.workweekPattern)
    .where(and(eq(schema.workweekPattern.id, id), eq(schema.workweekPattern.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('WORKWEEK_PATTERN_NOT_FOUND');
  return row;
}

export async function updateWorkweekPattern(
  ctx: AuthContext,
  id: string,
  patch: Partial<WorkweekPatternInput>,
  expectedVersion?: number
) {
  requireRole(ctx, 'ADMIN');
  if (patch.cycleLength !== undefined || patch.weeks !== undefined) {
    const existing = await getWorkweekPattern(ctx, id);
    const merged: WorkweekPatternInput = {
      name: patch.name ?? existing.name,
      cycleLength: patch.cycleLength ?? existing.cycleLength,
      weeks: patch.weeks ?? (existing.weeks as string[][]),
      referenceDate: patch.referenceDate ?? existing.referenceDate,
    };
    validatePattern(merged);
  }
  const conds = [eq(schema.workweekPattern.id, id), eq(schema.workweekPattern.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.workweekPattern.version, expectedVersion));
  const [row] = await db
    .update(schema.workweekPattern)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.cycleLength !== undefined && { cycleLength: patch.cycleLength }),
      ...(patch.weeks !== undefined && { weeks: patch.weeks }),
      ...(patch.referenceDate !== undefined && { referenceDate: patch.referenceDate }),
      version: sql`${schema.workweekPattern.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.workweekPattern.version })
        .from(schema.workweekPattern)
        .where(and(eq(schema.workweekPattern.id, id), eq(schema.workweekPattern.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('WORKWEEK_PATTERN_NOT_FOUND');
  }
  return row;
}

export async function archiveWorkweekPattern(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.workweekPattern)
    .set({
      isActive: false,
      version: sql`${schema.workweekPattern.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.workweekPattern.id, id), eq(schema.workweekPattern.orgId, ctx.orgId)));
}

// Resolve the effective pattern for a user (user → team → null).
export async function resolveUserPattern(orgId: string, userId: string) {
  const [usr] = await db
    .select({ workweekPatternId: schema.user.workweekPatternId, teamId: schema.user.teamId })
    .from(schema.user)
    .where(and(eq(schema.user.id, userId), eq(schema.user.orgId, orgId)))
    .limit(1);
  if (!usr) return null;

  const resolvePattern = async (patternId: string) => {
    const [p] = await db.select().from(schema.workweekPattern).where(eq(schema.workweekPattern.id, patternId)).limit(1);
    return p ?? null;
  };

  if (usr.workweekPatternId) return resolvePattern(usr.workweekPatternId);

  if (!usr.teamId) return null;
  const [t] = await db
    .select({ workweekPatternId: schema.team.workweekPatternId })
    .from(schema.team)
    .where(eq(schema.team.teamId, usr.teamId))
    .limit(1);
  if (!t?.workweekPatternId) return null;
  return resolvePattern(t.workweekPatternId);
}
