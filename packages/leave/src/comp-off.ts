import { and, eq } from 'drizzle-orm'
import { db, schema, type CompOff } from '@avkash/db'
import { type AuthContext, NotFoundError, ValidationError, ConflictError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { postLedger, todayStr } from './ledger'
import { getEffectivePolicy } from './leave-policy'
import { writeAudit } from './audit'

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export interface EarnCompOffInput {
  userId?: string // default: self
  workedOn: string // YYYY-MM-DD
  leaveTypeId: string // a COMP_OFF-kind leave type
  days?: number // default 1
}

// Record that someone worked extra. A USER may request their own; a MANAGER+ may
// grant for a teammate. Always starts PENDING (approval posts the credit).
export async function earnCompOff(ctx: AuthContext, input: EarnCompOffInput): Promise<CompOff> {
  const userId = input.userId ?? ctx.userId
  if (!userId) throw new ValidationError('NO_TARGET_USER')
  if (userId !== ctx.userId) requireRole(ctx, 'MANAGER')

  const [lt] = await db
    .select()
    .from(schema.leaveType)
    .where(and(eq(schema.leaveType.leaveTypeId, input.leaveTypeId), eq(schema.leaveType.orgId, ctx.orgId)))
    .limit(1)
  if (!lt) throw new NotFoundError('LEAVE_TYPE_NOT_FOUND')
  if (lt.kind !== 'COMP_OFF') throw new ValidationError('NOT_COMP_OFF_TYPE')

  const [row] = await db
    .insert(schema.compOff)
    .values({
      orgId: ctx.orgId,
      userId,
      leaveTypeId: input.leaveTypeId,
      workedOn: input.workedOn,
      days: String(input.days ?? 1),
      status: 'PENDING',
      createdBy: ctx.userId,
    })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'CompOff',
    keyword: 'compoff_earn',
    changed: { userId, workedOn: input.workedOn, days: input.days ?? 1 },
    changedBy: ctx.userId,
    userId,
  })
  return row
}

// Approve → post a COMP_OFF_CREDIT ledger entry that expires after the policy's
// compOffExpiryDays (use-it-or-lose-it). Redemption = applyLeave with this type.
export async function approveCompOff(ctx: AuthContext, compOffId: string): Promise<CompOff> {
  requireRole(ctx, 'MANAGER')
  const [co] = await db.select().from(schema.compOff).where(and(eq(schema.compOff.id, compOffId), eq(schema.compOff.orgId, ctx.orgId))).limit(1)
  if (!co) throw new NotFoundError('COMP_OFF_NOT_FOUND')
  if (co.status !== 'PENDING') throw new ConflictError('COMP_OFF_NOT_PENDING')

  const [u] = await db.select({ teamId: schema.user.teamId }).from(schema.user).where(eq(schema.user.id, co.userId)).limit(1)
  const policy = u?.teamId ? await getEffectivePolicy(ctx.orgId, u.teamId, co.leaveTypeId) : null
  const expiresOn = addDays(co.workedOn, policy?.compOffExpiryDays ?? 90)

  const [updated] = await db
    .update(schema.compOff)
    .set({ status: 'APPROVED', approvedBy: ctx.userId, expiresOn })
    .where(eq(schema.compOff.id, compOffId))
    .returning()
  await postLedger({
    orgId: ctx.orgId,
    userId: co.userId,
    leaveTypeId: co.leaveTypeId,
    kind: 'COMP_OFF_CREDIT',
    amount: co.days,
    effectiveOn: todayStr(),
    expiresOn,
    note: `comp-off for ${co.workedOn}`,
    createdBy: ctx.userId,
  })
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'CompOff',
    keyword: 'compoff_approve',
    changed: { days: co.days, expiresOn },
    changedBy: ctx.userId,
    userId: co.userId,
  })
  return updated
}

export async function rejectCompOff(ctx: AuthContext, compOffId: string): Promise<CompOff> {
  requireRole(ctx, 'MANAGER')
  const [co] = await db.select().from(schema.compOff).where(and(eq(schema.compOff.id, compOffId), eq(schema.compOff.orgId, ctx.orgId))).limit(1)
  if (!co) throw new NotFoundError('COMP_OFF_NOT_FOUND')
  if (co.status !== 'PENDING') throw new ConflictError('COMP_OFF_NOT_PENDING')
  const [updated] = await db.update(schema.compOff).set({ status: 'REJECTED', approvedBy: ctx.userId }).where(eq(schema.compOff.id, compOffId)).returning()
  await writeAudit({ orgId: ctx.orgId, tableName: 'CompOff', keyword: 'compoff_reject', changed: {}, changedBy: ctx.userId, userId: co.userId })
  return updated
}

export async function listCompOff(ctx: AuthContext, userId?: string): Promise<CompOff[]> {
  const target = ctx.role === 'USER' ? (ctx.userId ?? '') : (userId ?? ctx.userId ?? '')
  const where = userId || ctx.role === 'USER'
    ? and(eq(schema.compOff.orgId, ctx.orgId), eq(schema.compOff.userId, target))
    : eq(schema.compOff.orgId, ctx.orgId)
  return db.select().from(schema.compOff).where(where)
}
