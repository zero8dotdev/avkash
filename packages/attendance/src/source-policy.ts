import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, BusinessRuleError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
export { isSourceAllowed, isBypassSource } from './source-policy-pure';
export type { AttendanceSource } from './source-policy-pure';
import { isSourceAllowed, type AttendanceSource } from './source-policy-pure';

// Fetch the org's custom policy for a levelId (or null if no override).
async function getCustomPolicy(
  orgId: string,
  levelId: string
): Promise<{ levelId: string; allowedSources: string[] } | null> {
  const [row] = await db
    .select()
    .from(schema.attendanceSourcePolicy)
    .where(
      and(
        eq(schema.attendanceSourcePolicy.orgId, orgId),
        eq(schema.attendanceSourcePolicy.levelId, levelId)
      )
    )
    .limit(1);
  return row ?? null;
}

// Guard: throws if `source` is not permitted for the user's OrgLevel.
export async function assertSourceAllowed(
  orgId: string,
  levelId: string | null,
  source: AttendanceSource
): Promise<void> {
  const policy = levelId ? await getCustomPolicy(orgId, levelId) : null;
  const allowedSources = policy ? (policy.allowedSources as AttendanceSource[]) : null;
  if (!isSourceAllowed(allowedSources, source)) {
    throw new BusinessRuleError('PUNCH_SOURCE_NOT_ALLOWED', { source, levelId });
  }
}

// ── API handlers ──────────────────────────────────────────────────────────────

export async function listSourcePolicies(
  ctx: AuthContext
): Promise<{ levelId: string; levelName: string | null; allowedSources: string[] }[]> {
  requireRole(ctx, 'ADMIN');
  const rows = await db
    .select({
      levelId: schema.attendanceSourcePolicy.levelId,
      allowedSources: schema.attendanceSourcePolicy.allowedSources,
      levelName: schema.orgLevel.name,
    })
    .from(schema.attendanceSourcePolicy)
    .leftJoin(schema.orgLevel, eq(schema.orgLevel.id, schema.attendanceSourcePolicy.levelId))
    .where(eq(schema.attendanceSourcePolicy.orgId, ctx.orgId));
  return rows.map((r) => ({
    levelId: r.levelId,
    levelName: r.levelName ?? null,
    allowedSources: r.allowedSources,
  }));
}

export async function upsertSourcePolicy(
  ctx: AuthContext,
  levelId: string,
  allowedSources: AttendanceSource[]
): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .insert(schema.attendanceSourcePolicy)
    .values({
      orgId: ctx.orgId,
      levelId,
      allowedSources,
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [schema.attendanceSourcePolicy.orgId, schema.attendanceSourcePolicy.levelId],
      set: { allowedSources },
    });
}
