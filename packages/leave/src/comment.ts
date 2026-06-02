import { and, asc, eq, inArray } from 'drizzle-orm'
import { db, schema, type LeaveComment } from '@avkash/db'
import { type AuthContext, ForbiddenError, NotFoundError, ValidationError } from '@avkash/shared'
import { sendEmail } from '@avkash/notifications'
import { canApprove } from './approver'
import { writeAudit } from './audit'

export type CommentVisibility = 'INTERNAL' | 'SHARED'
export interface AddCommentInput {
  body: string
  visibility?: CommentVisibility
}

async function loadLeave(ctx: AuthContext, leaveId: string) {
  const [lv] = await db
    .select({ leaveId: schema.leave.leaveId, userId: schema.leave.userId, teamId: schema.leave.teamId })
    .from(schema.leave)
    .where(and(eq(schema.leave.leaveId, leaveId), eq(schema.leave.orgId, ctx.orgId)))
    .limit(1)
  return lv ?? null
}

// Applicant may post/read SHARED; approvers (manager/HR/delegate) may post/read
// INTERNAL too. INTERNAL is invisible to the applicant — that's what keeps the
// manager↔HR conversation private during escalation.
export async function addLeaveComment(ctx: AuthContext, leaveId: string, input: AddCommentInput): Promise<LeaveComment> {
  if (!input.body?.trim()) throw new ValidationError('Comment body is required')
  const lv = await loadLeave(ctx, leaveId)
  if (!lv) throw new NotFoundError('Leave not found')
  const isApplicant = lv.userId === ctx.userId
  const isApprover = await canApprove(ctx, lv.teamId)
  if (!isApplicant && !isApprover) throw new ForbiddenError('Not allowed on this leave')
  const visibility: CommentVisibility = input.visibility ?? 'SHARED'
  if (visibility === 'INTERNAL' && !isApprover) throw new ForbiddenError('Only approvers can add internal comments')

  const [row] = await db
    .insert(schema.leaveComment)
    .values({ orgId: ctx.orgId, leaveId, authorId: ctx.userId ?? '', body: input.body.trim(), visibility })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeaveComment',
    keyword: 'leave_comment',
    changed: { visibility },
    changedBy: ctx.userId,
    userId: lv.userId,
    teamId: lv.teamId,
  })
  await notify(lv, row, ctx.userId ?? '')
  return row
}

export async function listLeaveComments(ctx: AuthContext, leaveId: string): Promise<LeaveComment[]> {
  const lv = await loadLeave(ctx, leaveId)
  if (!lv) throw new NotFoundError('Leave not found')
  const isApplicant = lv.userId === ctx.userId
  const isApprover = await canApprove(ctx, lv.teamId)
  if (!isApplicant && !isApprover) throw new ForbiddenError('Not allowed on this leave')
  const conds = [eq(schema.leaveComment.leaveId, leaveId)]
  if (!isApprover) conds.push(eq(schema.leaveComment.visibility, 'SHARED')) // applicant sees SHARED only
  return db.select().from(schema.leaveComment).where(and(...conds)).orderBy(asc(schema.leaveComment.createdAt))
}

// SHARED-by-approver → notify the applicant. INTERNAL (or SHARED-by-applicant) →
// notify the team's managers. (HR/escalation recipients join once escalation lands.)
async function notify(
  lv: { userId: string; teamId: string },
  comment: { visibility: CommentVisibility; body: string },
  authorId: string,
): Promise<void> {
  const recipients = new Set<string>()
  if (comment.visibility === 'SHARED' && authorId !== lv.userId) {
    const [applicant] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, lv.userId)).limit(1)
    if (applicant?.email) recipients.add(applicant.email)
  }
  if (comment.visibility === 'INTERNAL' || authorId === lv.userId) {
    const [t] = await db.select({ managers: schema.team.managers }).from(schema.team).where(eq(schema.team.teamId, lv.teamId)).limit(1)
    const managerIds = (t?.managers ?? []).filter((id) => id !== authorId)
    if (managerIds.length) {
      const mgrs = await db.select({ email: schema.user.email }).from(schema.user).where(inArray(schema.user.id, managerIds))
      for (const m of mgrs) recipients.add(m.email)
    }
  }
  for (const email of recipients) void sendEmail({ to: email, subject: 'New comment on a leave request', text: comment.body })
}
