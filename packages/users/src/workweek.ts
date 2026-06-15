import { eq } from 'drizzle-orm';
import { db, schema, type User } from '@avkash/db';
import { type AuthContext, ValidationError, NotFoundError, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

type Day = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
const VALID: ReadonlySet<string> = new Set<Day>([
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

// Set a person's individual workweek (overrides their team's). HR (OWNER/ADMIN) for
// anyone; a MANAGER only for members of a team they manage. Not retroactive — past
// leaves keep their already-computed workingDays.
export async function setUserWorkweek(ctx: AuthContext, userId: string, days: string[]): Promise<User> {
  if (!Array.isArray(days) || days.length === 0) throw new ValidationError('WORKWEEK_EMPTY');
  const week = [...new Set(days.map((d) => String(d).toUpperCase()))];
  if (week.some((d) => !VALID.has(d))) throw new ValidationError('WORKWEEK_INVALID_DAY');

  const [target] = await db
    .select({ teamId: schema.user.teamId, orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  if (!target || target.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');

  if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
    requireRole(ctx, 'MANAGER');
    let isManager = false;
    if (target.teamId) {
      const [t] = await db
        .select({ managers: schema.team.managers })
        .from(schema.team)
        .where(eq(schema.team.teamId, target.teamId))
        .limit(1);
      isManager = !!t && (t.managers ?? []).includes(ctx.userId ?? '');
    }
    if (!isManager) throw new ForbiddenError('NOT_TEAM_MANAGER');
  }

  const [updated] = await db
    .update(schema.user)
    .set({ workweek: week as Day[], updatedBy: ctx.userId, updatedAt: new Date() })
    .where(eq(schema.user.id, userId))
    .returning();
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'User',
    userId,
    changedColumns: { workweek: week },
    changedBy: ctx.userId,
    keyword: 'workweek_override',
  });
  return updated;
}
