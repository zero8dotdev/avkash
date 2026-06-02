import { eq } from 'drizzle-orm'
import { db, schema, type User } from '@avkash/db'
import { type AuthContext, ValidationError, NotFoundError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'

// HR sets a person's employment start date (drives mid-year leave proration).
export async function setUserJoinedOn(ctx: AuthContext, userId: string, joinedOn: string): Promise<User> {
  requireRole(ctx, 'ADMIN')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(joinedOn))) throw new ValidationError('INVALID_DATE')
  const [target] = await db.select({ orgId: schema.user.orgId }).from(schema.user).where(eq(schema.user.id, userId)).limit(1)
  if (!target || target.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND')
  const [updated] = await db
    .update(schema.user)
    .set({ joinedOn, updatedBy: ctx.userId, updatedAt: new Date() })
    .where(eq(schema.user.id, userId))
    .returning()
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'User',
    userId,
    changedColumns: { joinedOn },
    changedBy: ctx.userId,
    keyword: 'joined_on_set',
  })
  return updated
}
