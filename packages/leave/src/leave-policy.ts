import { and, eq, sql } from 'drizzle-orm';
import { db, schema, type LeavePolicy } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { writeAudit } from './audit';

export interface CreateLeavePolicyInput {
  leaveTypeId: string;
  teamId: string;
  maxLeaves?: number;
  unlimited?: boolean;
  autoApprove?: boolean;
  allowNegativeBalance?: boolean;
  rollOver?: boolean;
  rollOverLimit?: number;
  rollOverExpiry?: string; // MM/DD
  accruals?: boolean;
  accrualFrequency?: 'MONTHLY' | 'QUARTERLY';
  accrueOn?: 'BEGINNING' | 'END';
  encashable?: boolean;
  encashmentMaxDays?: number;
  compOffExpiryDays?: number;
  prorateOnJoin?: boolean;
}

export async function createLeavePolicy(ctx: AuthContext, input: CreateLeavePolicyInput): Promise<LeavePolicy> {
  requireRole(ctx, 'MANAGER');
  // The leave type must belong to the caller's org.
  const [lt] = await db
    .select({ id: schema.leaveType.leaveTypeId })
    .from(schema.leaveType)
    .where(and(eq(schema.leaveType.leaveTypeId, input.leaveTypeId), eq(schema.leaveType.orgId, ctx.orgId)))
    .limit(1);
  if (!lt) throw new NotFoundError('LEAVE_TYPE_NOT_FOUND');
  const [row] = await db
    .insert(schema.leavePolicy)
    .values({
      leaveTypeId: input.leaveTypeId,
      teamId: input.teamId,
      maxLeaves: input.maxLeaves,
      unlimited: input.unlimited ?? false,
      autoApprove: input.autoApprove ?? false,
      allowNegativeBalance: input.allowNegativeBalance ?? false,
      rollOver: input.rollOver ?? false,
      rollOverLimit: input.rollOverLimit,
      rollOverExpiry: input.rollOverExpiry,
      accruals: input.accruals ?? false,
      accrualFrequency: input.accrualFrequency,
      accrueOn: input.accrueOn,
      encashable: input.encashable ?? false,
      encashmentMaxDays: input.encashmentMaxDays,
      compOffExpiryDays: input.compOffExpiryDays ?? 90,
      prorateOnJoin: input.prorateOnJoin ?? true,
      createdBy: ctx.userId,
    })
    .returning();
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeavePolicy',
    keyword: 'leavepolicy_create',
    changed: {
      leaveTypeId: row.leaveTypeId,
      maxLeaves: row.maxLeaves,
      unlimited: row.unlimited,
      autoApprove: row.autoApprove,
    },
    changedBy: ctx.userId,
    teamId: row.teamId,
  });
  return row;
}

// Active policy for a (team, leaveType). org-scoping is implicit via the team.
export async function getEffectivePolicy(
  _orgId: string,
  teamId: string,
  leaveTypeId: string
): Promise<LeavePolicy | null> {
  const [row] = await db
    .select()
    .from(schema.leavePolicy)
    .where(
      and(
        eq(schema.leavePolicy.teamId, teamId),
        eq(schema.leavePolicy.leaveTypeId, leaveTypeId),
        eq(schema.leavePolicy.isActive, true)
      )
    )
    .limit(1);
  return row ?? null;
}

// Single policy by id (for the GET that hands the client its current ETag/version).
export async function getLeavePolicy(ctx: AuthContext, leavePolicyId: string): Promise<LeavePolicy> {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.leavePolicy)
    .where(eq(schema.leavePolicy.leavePolicyId, leavePolicyId))
    .limit(1);
  if (!row) throw new NotFoundError('LEAVE_POLICY_NOT_FOUND');
  return row;
}

// Org's policies (optionally one team's). LeavePolicy has no orgId — it's scoped via
// its team — so we join Team to filter by the caller's org.
export async function listLeavePolicies(ctx: AuthContext, opts?: { teamId?: string }): Promise<LeavePolicy[]> {
  requireRole(ctx, 'MANAGER');
  const rows = await db
    .select({ policy: schema.leavePolicy })
    .from(schema.leavePolicy)
    .innerJoin(schema.team, eq(schema.leavePolicy.teamId, schema.team.teamId))
    .where(
      and(eq(schema.team.orgId, ctx.orgId), opts?.teamId ? eq(schema.leavePolicy.teamId, opts.teamId) : undefined)
    );
  return rows.map((r) => r.policy);
}

export async function updateLeavePolicy(
  ctx: AuthContext,
  leavePolicyId: string,
  patch: Partial<Omit<CreateLeavePolicyInput, 'leaveTypeId' | 'teamId'>> & { isActive?: boolean },
  expectedVersion?: number
): Promise<LeavePolicy> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.leavePolicy.leavePolicyId, leavePolicyId)];
  // Optimistic lock: with a version supplied, the row updates only if it still
  // matches — the compare-and-swap is atomic in the WHERE clause, no row lock held.
  if (expectedVersion !== undefined) conds.push(eq(schema.leavePolicy.version, expectedVersion));
  const [row] = await db
    .update(schema.leavePolicy)
    .set({ ...patch, version: sql`${schema.leavePolicy.version} + 1`, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(and(...conds))
    .returning();
  if (!row) {
    // Nothing updated: either the id is wrong, or the version moved under us.
    if (expectedVersion !== undefined) {
      const [current] = await db
        .select({ version: schema.leavePolicy.version })
        .from(schema.leavePolicy)
        .where(eq(schema.leavePolicy.leavePolicyId, leavePolicyId))
        .limit(1);
      if (current) {
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: current.version });
      }
    }
    throw new NotFoundError('LEAVE_POLICY_NOT_FOUND');
  }
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeavePolicy',
    keyword: 'leavepolicy_update',
    changed: patch,
    changedBy: ctx.userId,
    teamId: row.teamId,
  });
  return row;
}
