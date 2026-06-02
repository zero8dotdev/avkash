import { and, eq, gte, lte } from 'drizzle-orm'
import { db, schema, type ApprovalDelegation } from '@avkash/db'
import { type AuthContext, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { todayStr } from './ledger'
import { writeAudit } from './audit'

export interface SetDelegationInput {
  toUserId: string
  startsOn: string // YYYY-MM-DD
  endsOn: string
  teamId?: string // null/undefined = all teams the delegator manages
}

export async function setDelegation(ctx: AuthContext, input: SetDelegationInput): Promise<ApprovalDelegation> {
  requireRole(ctx, 'MANAGER')
  const [row] = await db
    .insert(schema.approvalDelegation)
    .values({
      orgId: ctx.orgId,
      fromManagerId: ctx.userId ?? '',
      toUserId: input.toUserId,
      teamId: input.teamId ?? null,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
    })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'ApprovalDelegation',
    keyword: 'delegation_set',
    changed: { toUserId: input.toUserId, startsOn: input.startsOn, endsOn: input.endsOn },
    changedBy: ctx.userId,
  })
  return row
}

export async function clearDelegation(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'MANAGER')
  const deleted = await db
    .delete(schema.approvalDelegation)
    .where(and(eq(schema.approvalDelegation.id, id), eq(schema.approvalDelegation.orgId, ctx.orgId)))
    .returning({ id: schema.approvalDelegation.id })
  if (!deleted.length) throw new NotFoundError('DELEGATION_NOT_FOUND')
  await writeAudit({ orgId: ctx.orgId, tableName: 'ApprovalDelegation', keyword: 'delegation_clear', changed: { id }, changedBy: ctx.userId })
}

export async function listDelegations(ctx: AuthContext): Promise<ApprovalDelegation[]> {
  return db.select().from(schema.approvalDelegation).where(eq(schema.approvalDelegation.orgId, ctx.orgId))
}

// Is `userId` an active delegate (today) authorised to approve for `teamId`?
export async function isActiveDelegate(
  orgId: string,
  userId: string,
  teamId: string,
  onDate = todayStr(),
): Promise<boolean> {
  const rows = await db
    .select({ teamId: schema.approvalDelegation.teamId })
    .from(schema.approvalDelegation)
    .where(
      and(
        eq(schema.approvalDelegation.orgId, orgId),
        eq(schema.approvalDelegation.toUserId, userId),
        lte(schema.approvalDelegation.startsOn, onDate),
        gte(schema.approvalDelegation.endsOn, onDate),
      ),
    )
  return rows.some((r) => r.teamId === null || r.teamId === teamId)
}
