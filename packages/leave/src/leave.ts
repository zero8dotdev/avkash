import { and, desc, eq, gte, inArray, lte, ne, or, type SQL } from 'drizzle-orm';
import { db, schema, type Leave } from '@avkash/db';
import {
  type AuthContext,
  type LeaveStatus,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { computeWorkingDays, type Duration } from './working-days';
import { getEffectivePolicy } from './leave-policy';
import { getBalance } from './balance';
import { postLedger, todayStr } from './ledger';
import { writeAudit } from './audit';
import { canApprove, resolveManagedTeams } from './approver';
import { resolveEscalation, escalateLeave } from './escalation';
import { notifyLeaveRequested, notifyLeaveDecision } from './leave-notify';
import { addLeaveComment } from './comment';

type Shift = 'MORNING' | 'AFTERNOON' | 'NONE';

export interface ApplyLeaveInput {
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  duration?: Duration;
  shift?: Shift;
  reason?: string;
  userId?: string; // MANAGER+ applying on behalf of a teammate
}

async function loadUser(userId: string) {
  const [u] = await db
    .select({ id: schema.user.id, teamId: schema.user.teamId, orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  return u ?? null;
}

async function audit(ctx: AuthContext, lv: { userId: string; teamId: string }, keyword: string, changed: unknown) {
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'Leave',
    keyword,
    changed,
    changedBy: ctx.userId,
    userId: lv.userId,
    teamId: lv.teamId,
  });
}

async function assertCanApprove(ctx: AuthContext, teamId: string) {
  if (!(await canApprove(ctx, teamId))) throw new ForbiddenError('NOT_TEAM_APPROVER');
}

export async function applyLeave(ctx: AuthContext, input: ApplyLeaveInput): Promise<Leave> {
  const targetUserId = input.userId ?? ctx.userId;
  if (!targetUserId) throw new ValidationError('NO_TARGET_USER');
  if (targetUserId !== ctx.userId) requireRole(ctx, 'MANAGER');

  const u = await loadUser(targetUserId);
  if (!u || u.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');
  if (!u.teamId) throw new BusinessRuleError('USER_NO_TEAM');
  // Exited employees can't apply leave (offboarding).
  const [emp] = await db
    .select({ status: schema.employeeProfile.employmentStatus })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, targetUserId))
    .limit(1);
  if (emp && (emp.status === 'TERMINATED' || emp.status === 'RESIGNED'))
    throw new BusinessRuleError('EMPLOYEE_INACTIVE');

  const duration: Duration = input.duration ?? 'FULL_DAY';
  const shift: Shift = input.shift ?? 'NONE';
  if (duration === 'HALF_DAY') {
    if (input.startDate !== input.endDate) throw new ValidationError('HALF_DAY_SINGLE_DAY');
    if (shift !== 'MORNING' && shift !== 'AFTERNOON') throw new ValidationError('HALF_DAY_NEEDS_SHIFT');
  }

  const [lt] = await db
    .select()
    .from(schema.leaveType)
    .where(
      and(
        eq(schema.leaveType.leaveTypeId, input.leaveTypeId),
        eq(schema.leaveType.orgId, ctx.orgId),
        eq(schema.leaveType.isActive, true)
      )
    )
    .limit(1);
  if (!lt) throw new NotFoundError('LEAVE_TYPE_NOT_FOUND');
  const policy = await getEffectivePolicy(ctx.orgId, u.teamId, input.leaveTypeId);

  const workingDays = await computeWorkingDays(ctx.orgId, targetUserId, input.startDate, input.endDate, duration);
  if (workingDays <= 0) throw new BusinessRuleError('NO_WORKING_DAYS');

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
        gte(schema.leave.endDate, input.startDate)
      )
    );
  const conflict = existing.some(
    (o) => duration === 'FULL_DAY' || o.duration === 'FULL_DAY' || (o.duration === 'HALF_DAY' && o.shift === shift)
  );
  if (conflict) throw new ConflictError('LEAVE_OVERLAP');

  // Balance check (bounded policies). Accrual policies now have a real accrued
  // balance in the ledger, so they're enforced too — you can't take un-accrued days.
  if (policy && !policy.unlimited && !policy.allowNegativeBalance) {
    const bal = await getBalance(ctx, targetUserId, input.leaveTypeId);
    if (typeof bal.available === 'number' && bal.available < workingDays) {
      throw new BusinessRuleError('INSUFFICIENT_BALANCE', { available: bal.available, requested: workingDays });
    }
  }

  const status: LeaveStatus = policy?.autoApprove ? 'APPROVED' : 'PENDING';
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
    .returning();

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
    });
  }
  // Inline escalation: a leave born severe (length) or of an always-escalate type
  // goes to HR immediately.
  if (
    status === 'PENDING' &&
    (lt.alwaysEscalate || (policy?.escalateOverDays != null && workingDays > policy.escalateOverDays))
  ) {
    const { targetUserId: escalateTo } = await resolveEscalation(ctx.orgId, u.teamId);
    await escalateLeave(
      leave,
      escalateTo,
      lt.alwaysEscalate
        ? `${lt.name} always requires HR approval`
        : `${workingDays} working days exceeds the ${policy?.escalateOverDays}-day threshold`
    );
    leave.escalatedAt = new Date(); // reflect the escalation on the returned row
    leave.escalatedTo = escalateTo;
  }
  await audit(ctx, leave, 'leave_apply', { status, workingDays });
  // A request awaiting a decision → notify the approvers. (Escalation, if any, already
  // notified HR above. Auto-approved leaves need no approver notification.)
  if (status === 'PENDING') await notifyLeaveRequested(leave);
  return leave;
}

async function setStatus(
  ctx: AuthContext,
  leaveId: string,
  status: 'APPROVED' | 'REJECTED',
  comment?: string
): Promise<Leave> {
  const [lv] = await db
    .select()
    .from(schema.leave)
    .where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId)))
    .limit(1);
  if (!lv) throw new NotFoundError('LEAVE_NOT_FOUND');
  await assertCanApprove(ctx, lv.teamId);
  if (lv.isApproved !== 'PENDING') throw new ConflictError('LEAVE_NOT_PENDING');
  const [updated] = await db
    .update(schema.leave)
    .set({ isApproved: status, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(eq(schema.leave.leaveId, leaveId))
    .returning();
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
    });
  }
  await audit(ctx, lv, 'leave_status', { isApproved: { old: 'PENDING', new: status } });
  // The decision note lives in the comment thread (single source of truth), SHARED with the applicant.
  if (comment?.trim()) await addLeaveComment(ctx, leaveId, { body: comment, visibility: 'SHARED' });
  await notifyLeaveDecision(updated, status); // tell the requester
  return updated;
}

export const approveLeave = (ctx: AuthContext, leaveId: string, comment?: string) =>
  setStatus(ctx, leaveId, 'APPROVED', comment);
export const rejectLeave = (ctx: AuthContext, leaveId: string, comment?: string) =>
  setStatus(ctx, leaveId, 'REJECTED', comment);

export async function cancelLeave(ctx: AuthContext, leaveId: string): Promise<void> {
  const [lv] = await db
    .select()
    .from(schema.leave)
    .where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId)))
    .limit(1);
  if (!lv) throw new NotFoundError('LEAVE_NOT_FOUND');
  if (lv.userId !== ctx.userId) requireRole(ctx, 'MANAGER');
  if (lv.isApproved === 'DELETED') throw new ConflictError('LEAVE_ALREADY_CANCELLED');
  const wasApproved = lv.isApproved === 'APPROVED';
  await db
    .update(schema.leave)
    .set({ isApproved: 'DELETED', updatedBy: ctx.userId, updatedOn: new Date() })
    .where(eq(schema.leave.leaveId, leaveId));
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
    });
  }
  await audit(ctx, lv, 'leave_status', { isApproved: { old: lv.isApproved, new: 'DELETED' } });
}

export interface ListLeavesFilter {
  userId?: string;
  status?: LeaveStatus;
}

export async function listLeaves(ctx: AuthContext, filter?: ListLeavesFilter): Promise<Leave[]> {
  const conds: SQL[] = [eq(schema.leave.orgId, ctx.orgId)];
  if (ctx.role === 'USER') {
    conds.push(eq(schema.leave.userId, ctx.userId ?? ''));
  } else if (ctx.role === 'MANAGER') {
    // See leaves for every team this manager can approve for (direct + delegated),
    // plus their own — so "what I see" matches "what I can act on".
    const teamIds = await resolveManagedTeams(ctx);
    conds.push(
      teamIds.length
        ? or(inArray(schema.leave.teamId, teamIds), eq(schema.leave.userId, ctx.userId ?? ''))!
        : eq(schema.leave.userId, ctx.userId ?? '')
    );
  }
  if (filter?.userId) conds.push(eq(schema.leave.userId, filter.userId));
  if (filter?.status) conds.push(eq(schema.leave.isApproved, filter.status));
  return db
    .select()
    .from(schema.leave)
    .where(and(...conds))
    .orderBy(desc(schema.leave.startDate));
}

export async function getLeave(ctx: AuthContext, leaveId: string): Promise<Leave> {
  const [lv] = await db
    .select()
    .from(schema.leave)
    .where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId)))
    .limit(1);
  if (!lv) throw new NotFoundError('LEAVE_NOT_FOUND');
  if (ctx.role === 'USER' && lv.userId !== ctx.userId) throw new ForbiddenError('LEAVE_FORBIDDEN');
  return lv;
}
