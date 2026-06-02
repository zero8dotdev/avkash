import { and, eq } from 'drizzle-orm'
import { db, schema, type Encashment } from '@avkash/db'
import { type AuthContext, ForbiddenError, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { postLedger, todayStr } from './ledger'
import { getEffectivePolicy } from './leave-policy'
import { getBalance } from './balance'
import { writeAudit } from './audit'

export interface RequestEncashmentInput {
  leaveTypeId: string
  days: number
  userId?: string // default: self
}

// Request to encash N days. Checks the policy allows encashment, the per-request
// cap, and that the days are actually available. Starts PENDING.
export async function requestEncashment(ctx: AuthContext, input: RequestEncashmentInput): Promise<Encashment> {
  const userId = input.userId ?? ctx.userId
  if (!userId) throw new ForbiddenError('No target user')
  if (userId !== ctx.userId) requireRole(ctx, 'MANAGER')
  if (input.days <= 0) throw new ForbiddenError('Days must be positive')

  const [u] = await db.select({ teamId: schema.user.teamId }).from(schema.user).where(eq(schema.user.id, userId)).limit(1)
  const policy = u?.teamId ? await getEffectivePolicy(ctx.orgId, u.teamId, input.leaveTypeId) : null
  if (!policy?.encashable) throw new ForbiddenError('This leave type is not encashable')
  if (policy.encashmentMaxDays != null && input.days > policy.encashmentMaxDays) {
    throw new ForbiddenError(`At most ${policy.encashmentMaxDays} days can be encashed`)
  }
  const bal = await getBalance(ctx, userId, input.leaveTypeId)
  if (typeof bal.available === 'number' && input.days > bal.available) {
    throw new ForbiddenError(`Only ${bal.available} days available to encash`)
  }

  const [row] = await db
    .insert(schema.encashment)
    .values({
      orgId: ctx.orgId,
      userId,
      leaveTypeId: input.leaveTypeId,
      days: String(input.days),
      status: 'PENDING',
      requestedBy: ctx.userId,
      createdBy: ctx.userId,
    })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'Encashment',
    keyword: 'encashment_request',
    changed: { leaveTypeId: input.leaveTypeId, days: input.days },
    changedBy: ctx.userId,
    userId,
  })
  return row
}

// Approve → post an ENCASHMENT debit (reduces balance). Payout itself is payroll's job.
export async function approveEncashment(ctx: AuthContext, id: string): Promise<Encashment> {
  requireRole(ctx, 'ADMIN')
  const [en] = await db.select().from(schema.encashment).where(and(eq(schema.encashment.id, id), eq(schema.encashment.orgId, ctx.orgId))).limit(1)
  if (!en) throw new NotFoundError('Encashment not found')
  if (en.status !== 'PENDING') throw new ForbiddenError('Encashment is not pending')
  const [updated] = await db.update(schema.encashment).set({ status: 'APPROVED', approvedBy: ctx.userId }).where(eq(schema.encashment.id, id)).returning()
  await postLedger({
    orgId: ctx.orgId,
    userId: en.userId,
    leaveTypeId: en.leaveTypeId,
    kind: 'ENCASHMENT',
    amount: String(-Number(en.days)),
    effectiveOn: todayStr(),
    note: 'leave encashment',
    createdBy: ctx.userId,
  })
  await writeAudit({ orgId: ctx.orgId, tableName: 'Encashment', keyword: 'encashment_approve', changed: { days: en.days }, changedBy: ctx.userId, userId: en.userId })
  return updated
}

export async function markEncashmentPaid(ctx: AuthContext, id: string): Promise<Encashment> {
  requireRole(ctx, 'ADMIN')
  const [updated] = await db
    .update(schema.encashment)
    .set({ status: 'PAID' })
    .where(and(eq(schema.encashment.id, id), eq(schema.encashment.orgId, ctx.orgId), eq(schema.encashment.status, 'APPROVED')))
    .returning()
  if (!updated) throw new NotFoundError('Approved encashment not found')
  await writeAudit({ orgId: ctx.orgId, tableName: 'Encashment', keyword: 'encashment_paid', changed: {}, changedBy: ctx.userId, userId: updated.userId })
  return updated
}

export async function rejectEncashment(ctx: AuthContext, id: string): Promise<Encashment> {
  requireRole(ctx, 'ADMIN')
  const [en] = await db.select().from(schema.encashment).where(and(eq(schema.encashment.id, id), eq(schema.encashment.orgId, ctx.orgId))).limit(1)
  if (!en) throw new NotFoundError('Encashment not found')
  if (en.status !== 'PENDING') throw new ForbiddenError('Encashment is not pending')
  const [updated] = await db.update(schema.encashment).set({ status: 'REJECTED', approvedBy: ctx.userId }).where(eq(schema.encashment.id, id)).returning()
  await writeAudit({ orgId: ctx.orgId, tableName: 'Encashment', keyword: 'encashment_reject', changed: {}, changedBy: ctx.userId, userId: en.userId })
  return updated
}
