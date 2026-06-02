import { and, eq, gte, lte, ne, type SQL } from 'drizzle-orm'
import { db, schema } from '@avkash/db'
import type { AuthContext } from '@avkash/shared'

export interface CalendarEntry {
  kind: 'leave' | 'holiday'
  startDate: string
  endDate: string
  title: string
  status?: string
  userId?: string | null
}

async function userTeam(userId: string): Promise<string | null> {
  const [u] = await db.select({ teamId: schema.user.teamId }).from(schema.user).where(eq(schema.user.id, userId)).limit(1)
  return u?.teamId ?? null
}

// Merged team/org calendar: approved+pending leaves and holidays in [from,to].
// (WFH and week-offs will join here once @avkash/attendance lands.)
export async function getCalendar(
  ctx: AuthContext,
  opts: { scope?: 'team' | 'org'; from: string; to: string },
): Promise<CalendarEntry[]> {
  const conds: SQL[] = [
    eq(schema.leave.orgId, ctx.orgId),
    lte(schema.leave.startDate, opts.to),
    gte(schema.leave.endDate, opts.from),
    ne(schema.leave.isApproved, 'DELETED'),
    ne(schema.leave.isApproved, 'REJECTED'),
  ]
  if (ctx.role === 'USER') {
    conds.push(eq(schema.leave.userId, ctx.userId ?? ''))
  } else if (ctx.role === 'MANAGER' && opts.scope !== 'org') {
    const teamId = await userTeam(ctx.userId ?? '')
    if (teamId) conds.push(eq(schema.leave.teamId, teamId))
  }

  const leaves = await db
    .select({
      userId: schema.leave.userId,
      startDate: schema.leave.startDate,
      endDate: schema.leave.endDate,
      status: schema.leave.isApproved,
      name: schema.leaveType.name,
    })
    .from(schema.leave)
    .innerJoin(schema.leaveType, eq(schema.leave.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(and(...conds))

  const holidays = await db
    .select({ name: schema.holiday.name, date: schema.holiday.date })
    .from(schema.holiday)
    .where(
      and(
        eq(schema.holiday.orgId, ctx.orgId),
        gte(schema.holiday.date, new Date(`${opts.from}T00:00:00Z`)),
        lte(schema.holiday.date, new Date(`${opts.to}T23:59:59Z`)),
      ),
    )

  return [
    ...leaves.map(
      (l): CalendarEntry => ({ kind: 'leave', startDate: l.startDate, endDate: l.endDate, title: l.name, status: l.status, userId: l.userId }),
    ),
    ...holidays.map((h): CalendarEntry => {
      const d = h.date.toISOString().slice(0, 10)
      return { kind: 'holiday', startDate: d, endDate: d, title: h.name }
    }),
  ]
}
