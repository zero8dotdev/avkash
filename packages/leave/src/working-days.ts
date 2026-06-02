import { eq } from 'drizzle-orm'
import { db, schema } from '@avkash/db'

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const
export type DayName = (typeof DAY_NAMES)[number]
export type Duration = 'FULL_DAY' | 'HALF_DAY'

export interface HolidayLite {
  date: string
  isRecurring: boolean
}

const toUtc = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`)
const sameMonthDay = (a: Date, b: Date) => a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()

// Pure: count working days in [start,end] — days that are in the team's workweek
// and not a holiday (recurring holidays match by month+day). HALF_DAY ⇒ /2.
export function calculateWorkingDays(
  workweek: readonly DayName[],
  holidays: readonly HolidayLite[],
  startDate: string,
  endDate: string,
  duration: Duration = 'FULL_DAY',
): number {
  const start = toUtc(startDate)
  const end = toUtc(endDate)
  const work = new Set(workweek)
  const hol = holidays.map((h) => ({ d: toUtc(h.date), r: h.isRecurring }))
  let count = 0
  for (const cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    if (!work.has(DAY_NAMES[cur.getUTCDay()])) continue
    const isHoliday = hol.some(({ d, r }) => (r ? sameMonthDay(d, cur) : d.getTime() === cur.getTime()))
    if (!isHoliday) count += 1
  }
  return duration === 'HALF_DAY' ? count / 2 : count
}

// DB wrapper: load the team's workweek + the org's holidays, then compute.
export async function computeWorkingDays(
  orgId: string,
  teamId: string,
  startDate: string,
  endDate: string,
  duration: Duration = 'FULL_DAY',
): Promise<number> {
  const [team] = await db
    .select({ workweek: schema.team.workweek })
    .from(schema.team)
    .where(eq(schema.team.teamId, teamId))
    .limit(1)
  const workweek = (team?.workweek ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']) as DayName[]
  const holidays = await db
    .select({ date: schema.holiday.date, isRecurring: schema.holiday.isRecurring })
    .from(schema.holiday)
    .where(eq(schema.holiday.orgId, orgId))
  const hl: HolidayLite[] = holidays.map((h) => ({ date: String(h.date), isRecurring: h.isRecurring }))
  return calculateWorkingDays(workweek, hl, startDate, endDate, duration)
}
