import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db, schema, type Leave } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError, ConflictError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { sendEmail } from '@avkash/notifications';
import { canApprove } from './approver';

const DEFAULT_ESCALATE_AFTER_DAYS = 3;

export interface ResolvedEscalation {
  afterDays: number; // 0 = off
  targetUserId: string | null; // designated HR, or null → all ADMIN/OWNER
}

// Resolve a team's escalation config — the null-means-inherit cascade:
// WHEN: team.escalateAfterDays → org → 3.   WHO: team.escalatesTo → null (all ADMINs).
export async function resolveEscalation(orgId: string, teamId: string | null): Promise<ResolvedEscalation> {
  const [org] = await db
    .select({ d: schema.organisation.escalateAfterDays })
    .from(schema.organisation)
    .where(eq(schema.organisation.orgId, orgId))
    .limit(1);
  let team: { d: number | null; to: string | null } | undefined;
  if (teamId) {
    [team] = await db
      .select({ d: schema.team.escalateAfterDays, to: schema.team.escalatesTo })
      .from(schema.team)
      .where(eq(schema.team.teamId, teamId))
      .limit(1);
  }
  return { afterDays: team?.d ?? org?.d ?? DEFAULT_ESCALATE_AFTER_DAYS, targetUserId: team?.to ?? null };
}

// Flag a leave as escalated and notify HR — the designated escalatesTo user, or every
// ADMIN/OWNER when none is set. Reused by the inline, cron, and manual paths. The
// manager keeps their approval rights (notify-only); canApprove already lets HR act.
export async function escalateLeave(leave: Leave, targetUserId: string | null, reason: string): Promise<void> {
  await db
    .update(schema.leave)
    .set({ escalatedAt: new Date(), escalatedTo: targetUserId })
    .where(eq(schema.leave.leaveId, leave.leaveId));
  const recipients = targetUserId
    ? await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, targetUserId))
    : await db
        .select({ email: schema.user.email })
        .from(schema.user)
        .where(and(eq(schema.user.orgId, leave.orgId), inArray(schema.user.role, ['ADMIN', 'OWNER'])));
  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject: 'Leave escalated for HR review',
        text: `A leave (${leave.startDate} → ${leave.endDate}) needs HR attention.\nReason: ${reason}`,
      })
    )
  );
}

// Cron: escalate PENDING leaves that have sat past their resolved SLA (calendar days).
export async function runEscalations(now: Date = new Date()): Promise<{ escalated: number }> {
  const pendings = await db
    .select()
    .from(schema.leave)
    .where(and(eq(schema.leave.isApproved, 'PENDING'), isNull(schema.leave.escalatedAt)));
  const results = await Promise.all(
    pendings.map(async (lv) => {
      const { afterDays, targetUserId } = await resolveEscalation(lv.orgId, lv.teamId);
      if (afterDays <= 0) return 0;
      const createdMs = lv.createdOn ? new Date(lv.createdOn).getTime() : now.getTime();
      const ageDays = (now.getTime() - createdMs) / 86_400_000;
      if (ageDays < afterDays) return 0;
      await escalateLeave(lv, targetUserId, `No decision within ${afterDays} days`);
      return 1;
    })
  );
  return { escalated: results.filter(Boolean).length };
}

// Manual: the applicant or an approver pushes a stuck PENDING leave to HR.
export async function escalateLeaveManual(ctx: AuthContext, leaveId: string, reason?: string): Promise<Leave> {
  const [lv] = await db
    .select()
    .from(schema.leave)
    .where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId)))
    .limit(1);
  if (!lv) throw new NotFoundError('LEAVE_NOT_FOUND');
  if (lv.userId !== ctx.userId && !(await canApprove(ctx, lv.teamId))) throw new ForbiddenError('LEAVE_FORBIDDEN');
  if (lv.isApproved !== 'PENDING') throw new ConflictError('LEAVE_NOT_PENDING');
  const { targetUserId } = await resolveEscalation(ctx.orgId, lv.teamId);
  await escalateLeave(lv, targetUserId, reason ?? 'Manually escalated');
  const [updated] = await db.select().from(schema.leave).where(eq(schema.leave.leaveId, leaveId)).limit(1);
  return updated;
}

// HR config: the team's escalation routing (when + who).
export async function setTeamEscalation(
  ctx: AuthContext,
  teamId: string,
  patch: { escalateAfterDays?: number | null; escalatesTo?: string | null }
): Promise<void> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.team)
    .set(patch)
    .where(and(eq(schema.team.teamId, teamId), eq(schema.team.orgId, ctx.orgId)))
    .returning({ id: schema.team.teamId });
  if (!row) throw new NotFoundError('USER_NO_TEAM');
}

export async function setOrgEscalation(ctx: AuthContext, escalateAfterDays: number | null): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db.update(schema.organisation).set({ escalateAfterDays }).where(eq(schema.organisation.orgId, ctx.orgId));
}
