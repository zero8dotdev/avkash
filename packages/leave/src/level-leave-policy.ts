import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export type LevelLeavePolicyInput = {
  leaveTypeId: string;
  levelId: string; // FK → OrgLevel.id
  maxLeaves?: number | null;
  accrualPerMonth?: string | null;
  rollOverLimit?: number | null;
};

// Upsert (ADMIN). One policy per (org, leaveType, level).
export async function upsertLevelPolicy(ctx: AuthContext, input: LevelLeavePolicyInput) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.levelLeavePolicy)
    .values({
      orgId: ctx.orgId,
      leaveTypeId: input.leaveTypeId,
      levelId: input.levelId,
      maxLeaves: input.maxLeaves ?? null,
      accrualPerMonth: input.accrualPerMonth ?? null,
      rollOverLimit: input.rollOverLimit ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [schema.levelLeavePolicy.orgId, schema.levelLeavePolicy.leaveTypeId, schema.levelLeavePolicy.levelId],
      set: {
        maxLeaves: input.maxLeaves ?? null,
        accrualPerMonth: input.accrualPerMonth ?? null,
        rollOverLimit: input.rollOverLimit ?? null,
        updatedBy: ctx.userId,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function listLevelPolicies(ctx: AuthContext, leaveTypeId?: string) {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.levelLeavePolicy.orgId, ctx.orgId)];
  if (leaveTypeId) conds.push(eq(schema.levelLeavePolicy.leaveTypeId, leaveTypeId));
  return db
    .select({
      id: schema.levelLeavePolicy.id,
      levelId: schema.levelLeavePolicy.levelId,
      levelName: schema.orgLevel.name,
      leaveTypeId: schema.levelLeavePolicy.leaveTypeId,
      maxLeaves: schema.levelLeavePolicy.maxLeaves,
      accrualPerMonth: schema.levelLeavePolicy.accrualPerMonth,
      rollOverLimit: schema.levelLeavePolicy.rollOverLimit,
    })
    .from(schema.levelLeavePolicy)
    .leftJoin(schema.orgLevel, eq(schema.orgLevel.id, schema.levelLeavePolicy.levelId))
    .where(and(...conds));
}

// Resolve overrides for a specific user's levelId on a given leave type.
// Returns null when no override — caller falls back to team's LeavePolicy.
export async function getEffectiveLevelPolicy(
  orgId: string,
  leaveTypeId: string,
  levelId: string | null
): Promise<{
  maxLeaves: number | null;
  accrualPerMonth: string | null;
  rollOverLimit: number | null;
} | null> {
  if (!levelId) return null;
  const [row] = await db
    .select()
    .from(schema.levelLeavePolicy)
    .where(
      and(
        eq(schema.levelLeavePolicy.orgId, orgId),
        eq(schema.levelLeavePolicy.leaveTypeId, leaveTypeId),
        eq(schema.levelLeavePolicy.levelId, levelId)
      )
    )
    .limit(1);
  if (!row) return null;
  return {
    maxLeaves: row.maxLeaves,
    accrualPerMonth: row.accrualPerMonth,
    rollOverLimit: row.rollOverLimit,
  };
}
