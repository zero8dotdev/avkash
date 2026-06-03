import { eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { resolveHolidays } from '@avkash/holidays';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
export type DayName = (typeof DAY_NAMES)[number];
export type Duration = 'FULL_DAY' | 'HALF_DAY';
const DEFAULT_WORKWEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as DayName[];

export interface HolidayLite {
  date: string;
  isRecurring: boolean;
}

const toUtc = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`);
const sameMonthDay = (a: Date, b: Date) => a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();

// Pure: count working days in [start,end] — days that are in the team's workweek
// and not a holiday (recurring holidays match by month+day). HALF_DAY ⇒ /2.
export function calculateWorkingDays(
  workweek: readonly DayName[],
  holidays: readonly HolidayLite[],
  startDate: string,
  endDate: string,
  duration: Duration = 'FULL_DAY'
): number {
  const start = toUtc(startDate);
  const end = toUtc(endDate);
  const work = new Set(workweek);
  const hol = holidays.map((h) => ({ d: toUtc(h.date), r: h.isRecurring }));
  let count = 0;
  for (const cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + 1)) {
    if (!work.has(DAY_NAMES[cur.getUTCDay()])) continue;
    const isHoliday = hol.some(({ d, r }) => (r ? sameMonthDay(d, cur) : d.getTime() === cur.getTime()));
    if (!isHoliday) count += 1;
  }
  return duration === 'HALF_DAY' ? count / 2 : count;
}

// DB wrapper: resolve the person's EFFECTIVE workweek (own override → team → Mon–Fri)
// and the holidays that apply to THEM (team's country → org's first location), then
// compute. Holidays are scoped by location so a German employee doesn't get India's.
export async function computeWorkingDays(
  orgId: string,
  userId: string,
  startDate: string,
  endDate: string,
  duration: Duration = 'FULL_DAY'
): Promise<number> {
  const [u] = await db
    .select({ workweek: schema.user.workweek, teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  let teamWorkweek: DayName[] | null = null;
  let location: string | null = null;
  if (u?.teamId) {
    const [team] = await db
      .select({ workweek: schema.team.workweek, location: schema.team.location })
      .from(schema.team)
      .where(eq(schema.team.teamId, u.teamId))
      .limit(1);
    teamWorkweek = (team?.workweek ?? null) as DayName[] | null;
    location = team?.location ?? null;
  }
  const userWorkweek = u?.workweek && u.workweek.length > 0 ? (u.workweek as DayName[]) : null;
  const workweek = userWorkweek ?? teamWorkweek ?? DEFAULT_WORKWEEK;

  // No team location → fall back to the org's first declared location (country).
  if (!location) {
    const [org] = await db
      .select({ location: schema.organisation.location })
      .from(schema.organisation)
      .where(eq(schema.organisation.orgId, orgId))
      .limit(1);
    location = org?.location?.[0] ?? null;
  }

  const holidays = await resolveHolidays(orgId, location, Number(startDate.slice(0, 4)), Number(endDate.slice(0, 4)));
  return calculateWorkingDays(workweek, holidays, startDate, endDate, duration);
}
