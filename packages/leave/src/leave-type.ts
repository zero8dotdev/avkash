import { and, eq } from 'drizzle-orm'
import { db, schema, type LeaveType } from '@avkash/db'
import { type AuthContext, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { writeAudit } from './audit'

export interface CreateLeaveTypeInput {
  name: string
  color?: string
  kind?: 'LEAVE' | 'COMP_OFF'
  isPaid?: boolean
  emoji?: string
  statusMsg?: string
}

export async function createLeaveType(ctx: AuthContext, input: CreateLeaveTypeInput): Promise<LeaveType> {
  requireRole(ctx, 'ADMIN')
  const [row] = await db
    .insert(schema.leaveType)
    .values({
      name: input.name,
      color: input.color,
      kind: input.kind ?? 'LEAVE',
      isPaid: input.isPaid ?? true,
      emoji: input.emoji,
      statusMsg: input.statusMsg,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    })
    .returning()
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeaveType',
    keyword: 'leavetype_create',
    changed: { name: row.name, kind: row.kind, isPaid: row.isPaid },
    changedBy: ctx.userId,
  })
  return row
}

export async function listLeaveTypes(ctx: AuthContext, opts?: { activeOnly?: boolean }): Promise<LeaveType[]> {
  const where = opts?.activeOnly
    ? and(eq(schema.leaveType.orgId, ctx.orgId), eq(schema.leaveType.isActive, true))
    : eq(schema.leaveType.orgId, ctx.orgId)
  return db.select().from(schema.leaveType).where(where)
}

export async function updateLeaveType(
  ctx: AuthContext,
  leaveTypeId: string,
  patch: Partial<CreateLeaveTypeInput> & { isActive?: boolean },
): Promise<LeaveType> {
  requireRole(ctx, 'ADMIN')
  const [row] = await db
    .update(schema.leaveType)
    .set({ ...patch, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(and(eq(schema.leaveType.leaveTypeId, leaveTypeId), eq(schema.leaveType.orgId, ctx.orgId)))
    .returning()
  if (!row) throw new NotFoundError('LEAVE_TYPE_NOT_FOUND')
  await writeAudit({ orgId: ctx.orgId, tableName: 'LeaveType', keyword: 'leavetype_update', changed: patch, changedBy: ctx.userId })
  return row
}
