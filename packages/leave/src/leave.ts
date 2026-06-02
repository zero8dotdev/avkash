import { and, desc, eq, gte, lte, ne, type SQL } from 'drizzle-orm'
import { db, schema, type Leave } from '@avkash/db'
import { type AuthContext, type LeaveStatus, ForbiddenError, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { computeWorkingDays, type Duration } from './working-days'
import { getEffectivePolicy } from './leave-policy'
import { getBalance } from './balance'
import { postLedger, todayStr } from './ledger'
import { writeAudit } from './audit'
import { isActiveDelegate } from './delegation'

type Shift = 'MORNING' | 'AFTERNOON' | 'NONE'

export interface ApplyLeaveInput {
  leaveTypeId: string
  startDate: string // YYYY-MM-DD
  endDate: string
  duration?: Duration
  shift?: Shift
  reason?: string
  userId?: string // MANAGER+ applying on behalf of a teammate
}

async function loadUser(userId: string) {
  const [u] = await db
    .select({ id: schema.user.id, teamId: schema.user.teamId, orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1)
  return u ?? null
}

async function audit(ctx: AuthContext, lv: { userId: string; teamId: string }, keyword: string, changed: unknown) {
  await writeAudit({ orgId: ctx.orgId, tableName: 'Leave', keyword, changed, changedBy: ctx.userId, userId: lv.userId, teamId: lv.teamId })
}

async function assertCanApprove(ctx: AuthContext, teamId: string) {
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return
  // A team manager can approve...
  const [t] = await db.select({ managers: schema.team.managers }).from(schema.team).where(eq(schema.team.teamId, teamId)).limit(1)
  if (t && (t.managers ?? []).includes(ctx.userId ?? '')) return
  // ...or an active delegate (a manager may delegate their approvals for a period).
  if (await isActiveDelegate(ctx.orgId, ctx.userId ?? '', teamId)) return
  throw new ForbiddenError('Not authorised to approve for this team')
}

export async function applyLeave(ctx: AuthContext, input: ApplyLeaveInput): Promise<Leave> {
  const targetUserId = input.userId ?? ctx.userId
  if (!targetUserId) throw new ForbiddenError('No target user')
  if (targetUserId !== ctx.userId) requireRole(ctx, 'MANAGER')

  const u = await loadUser(targetUserId)
  if (!u || u.orgId !== ctx.orgId) throw new NotFoundError('User not found')
  if (!u.teamId) throw new ForbiddenError('User is not assigned to a team')

  const duration: Duration = input.duration ?? 'FULL_DAY'
  const shift: Shift = input.shift ?? 'NONE'
  if (duration === 'HALF_DAY') {
    if (input.startDate !== input.endDate) throw new ForbiddenError('Half-day leave must be a single day')
    if (shift !== 'MORNING' && shift !== 'AFTERNOON') throw new ForbiddenError('Half-day leave requires a shift')
  }

  const [lt] = await db
    .select()
    .from(schema.leaveType)
    .where(
      and(
        eq(schema.leaveType.leaveTypeId, input.leaveTypeId),
        eq(schema.leaveType.orgId, ctx.orgId),
        eq(schema.leaveType.isActive, true),
      ),
    )
    .limit(1)
  if (!lt) throw new NotFoundError('Leave type not found or inactive')
  const policy = await getEffectivePolicy(ctx.orgId, u.teamId, input.leaveTypeId)

  const workingDays = await computeWorkingDays(ctx.orgId, u.teamId, input.startDate, input.endDate, duration)
  if (workingDays <= 0) throw new ForbiddenError('No working days in the selected range')

  // Overlap guard (ported from the DB trigger): block if a non-rejected leave
  // overlaps and (either is FULL_DAY, or both HALF_DAY with the same shift).
  const existing = await db
    .select({ duration: schema.leave.duration, shift: schema.leave.shift })
    .from(schema.leave)
    .where(
      and(
        eq(schema.leave.userId, targetUserId),
        ne(schema.leave.isApproved, 'REJECTED'),
        ne(schema.leave.isApproved, 'DELETED'),
        lte(schema.leave.startDate, input.endDate),
        gte(schema.leave.endDate, input.startDate),
      ),
    )
  const conflict = existing.some(
    (o) => duration === 'FULL_DAY' || o.duration === 'FULL_DAY' || (o.duration === 'HALF_DAY' && o.shift === shift),
  )
  if (conflict) throw new ForbiddenError('Leave request overlaps with an existing leave')

  // Balance check (bounded policies). Accrual policies now have a real accrued
  // balance in the ledger, so they're enforced too — you can't take un-accrued days.
  if (policy && !policy.unlimited && !policy.allowNegativeBalance) {
    const bal = await getBalance(ctx, targetUserId, input.leaveTypeId)
    if (typeof bal.available === 'number' && bal.available < workingDays) {
      throw new ForbiddenError(`Insufficient leave balance (available ${bal.available}, requested ${workingDays})`)
    }
  }

  const status: LeaveStatus = policy?.autoApprove ? 'APPROVED' : 'PENDING'
  const [leave] = await db
    .insert(schema.leave)
    .values({
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      duration,
      shift,
      isApproved: status,
      userId: targetUserId,
      teamId: u.teamId,
      orgId: ctx.orgId,
      reason: input.reason,
      workingDays: String(workingDays),
      createdBy: ctx.userId,
    })
    .returning()

  if (status === 'APPROVED') {
    await postLedger({
      orgId: ctx.orgId,
      userId: targetUserId,
      leaveTypeId: input.leaveTypeId,
      kind: 'TAKEN',
      amount: String(-workingDays),
      effectiveOn: todayStr(), // a committed leave reduces balance now (date kept via leaveId)
      leaveId: leave.leaveId,
      createdBy: ctx.userId,
    })
  }
  await audit(ctx, leave, 'leave_apply', { status, workingDays })
  return leave
}

async function setStatus(ctx: AuthContext, leaveId: string, status: 'APPROVED' | 'REJECTED', comment?: string): Promise<Leave> {
  const [lv] = await db.select().from(schema.leave).where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId))).limit(1)
  if (!lv) throw new NotFoundError('Leave not found')
  await assertCanApprove(ctx, lv.teamId)
  if (lv.isApproved !== 'PENDING') throw new ForbiddenError('Leave is not pending')
  const [updated] = await db
    .update(schema.leave)
    .set({ isApproved: status, managerComment: comment, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(eq(schema.leave.leaveId, leaveId))
    .returning()
  if (status === 'APPROVED') {
    await postLedger({
      orgId: ctx.orgId,
      userId: lv.userId,
      leaveTypeId: lv.leaveTypeId,
      kind: 'TAKEN',
      amount: String(-Number(lv.workingDays)),
      effectiveOn: todayStr(), // a committed leave reduces balance now (date kept via leaveId)
      leaveId: lv.leaveId,
      createdBy: ctx.userId,
    })
  }
  await audit(ctx, lv, 'leave_status', { isApproved: { old: 'PENDING', new: status } })
  return updated
}

export const approveLeave = (ctx: AuthContext, leaveId: string, comment?: string) => setStatus(ctx, leaveId, 'APPROVED', comment)
export const rejectLeave = (ctx: AuthContext, leaveId: string, comment?: string) => setStatus(ctx, leaveId, 'REJECTED', comment)

export async function cancelLeave(ctx: AuthContext, leaveId: string): Promise<void> {
  const [lv] = await db.select().from(schema.leave).where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId))).limit(1)
  if (!lv) throw new NotFoundError('Leave not found')
  if (lv.userId !== ctx.userId) requireRole(ctx, 'MANAGER')
  if (lv.isApproved === 'DELETED') throw new ForbiddenError('Leave already cancelled')
  const wasApproved = lv.isApproved === 'APPROVED'
  await db.update(schema.leave).set({ isApproved: 'DELETED', updatedBy: ctx.userId, updatedOn: new Date() }).where(eq(schema.leave.leaveId, leaveId))
  if (wasApproved) {
    await postLedger({
      orgId: ctx.orgId,
      userId: lv.userId,
      leaveTypeId: lv.leaveTypeId,
      kind: 'ADJUSTMENT',
      amount: String(Number(lv.workingDays)),
      effectiveOn: todayStr(),
      note: 'cancellation reversal',
      leaveId: lv.leaveId,
      createdBy: ctx.userId,
    })
  }
  await audit(ctx, lv, 'leave_status', { isApproved: { old: lv.isApproved, new: 'DELETED' } })
}

export interface ListLeavesFilter {
  userId?: string
  status?: LeaveStatus
}

export async function listLeaves(ctx: AuthContext, filter?: ListLeavesFilter): Promise<Leave[]> {
  const conds: SQL[] = [eq(schema.leave.orgId, ctx.orgId)]
  if (ctx.role === 'USER') {
    conds.push(eq(schema.leave.userId, ctx.userId ?? ''))
  } else if (ctx.role === 'MANAGER') {
    const u = await loadUser(ctx.userId ?? '')
    conds.push(u?.teamId ? eq(schema.leave.teamId, u.teamId) : eq(schema.leave.userId, ctx.userId ?? ''))
  }
  if (filter?.userId) conds.push(eq(schema.leave.userId, filter.userId))
  if (filter?.status) conds.push(eq(schema.leave.isApproved, filter.status))
  return db.select().from(schema.leave).where(and(...conds)).orderBy(desc(schema.leave.startDate))
}

export async function getLeave(ctx: AuthContext, leaveId: string): Promise<Leave> {
  const [lv] = await db.select().from(schema.leave).where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId))).limit(1)
  if (!lv) throw new NotFoundError('Leave not found')
  if (ctx.role === 'USER' && lv.userId !== ctx.userId) throw new ForbiddenError('Not allowed')
  return lv
}
