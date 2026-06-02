import { and, eq } from 'drizzle-orm'
import { db, schema, type LeavePolicy } from '@avkash/db'
import { type AuthContext, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { writeAudit } from './audit'

export interface CreateLeavePolicyInput {
  leaveTypeId: string
  teamId: string
  maxLeaves?: number
  unlimited?: boolean
  autoApprove?: boolean
  allowNegativeBalance?: boolean
  rollOver?: boolean
  rollOverLimit?: number
  rollOverExpiry?: string // MM/DD
  accruals?: boolean
  accrualFrequency?: 'MONTHLY' | 'QUARTERLY'
  accrueOn?: 'BEGINNING' | 'END'
  encashable?: boolean
  encashmentMaxDays?: number
  compOffExpiryDays?: number
}

export async function createLeavePolicy(ctx: AuthContext, input: CreateLeavePolicyInput): Promise<LeavePolicy> {
  requireRole(ctx, 'MANAGER')
  // The leave type must belong to the caller's org.
  const [lt] = await db
    .select({ id: schema.leaveType.leaveTypeId })
    .from(schema.leaveType)
    .where(and(eq(schema.leaveType.leaveTypeId, input.leaveTypeId), eq(schema.leaveType.orgId, ctx.orgId)))
    .limit(1)
  if (!lt) throw new NotFoundError('Leave type not found')
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
      createdBy: ctx.userId,
    })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeavePolicy',
    keyword: 'leavepolicy_create',
    changed: { leaveTypeId: row.leaveTypeId, maxLeaves: row.maxLeaves, unlimited: row.unlimited, autoApprove: row.autoApprove },
    changedBy: ctx.userId,
    teamId: row.teamId,
  })
  return row
}

// Active policy for a (team, leaveType). org-scoping is implicit via the team.
export async function getEffectivePolicy(
  _orgId: string,
  teamId: string,
  leaveTypeId: string,
): Promise<LeavePolicy | null> {
  const [row] = await db
    .select()
    .from(schema.leavePolicy)
    .where(
      and(
        eq(schema.leavePolicy.teamId, teamId),
        eq(schema.leavePolicy.leaveTypeId, leaveTypeId),
        eq(schema.leavePolicy.isActive, true),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function updateLeavePolicy(
  ctx: AuthContext,
  leavePolicyId: string,
  patch: Partial<Omit<CreateLeavePolicyInput, 'leaveTypeId' | 'teamId'>> & { isActive?: boolean },
): Promise<LeavePolicy> {
  requireRole(ctx, 'MANAGER')
  const [row] = await db
    .update(schema.leavePolicy)
    .set({ ...patch, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(eq(schema.leavePolicy.leavePolicyId, leavePolicyId))
    .returning()
  if (!row) throw new NotFoundError('Leave policy not found')
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeavePolicy',
    keyword: 'leavepolicy_update',
    changed: patch,
    changedBy: ctx.userId,
    teamId: row.teamId,
  })
  return row
}
