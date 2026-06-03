import { and, eq, gte, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { resolveHolidays } from '@avkash/holidays';

type AttendancePunch = typeof schema.attendancePunch.$inferSelect;

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
type DayName = (typeof DAY_NAMES)[number];
const DEFAULT_WORKWEEK: DayName[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'WFH' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF';
export interface DayAttendance {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  firstIn: string | null;
  lastOut: string | null;
  hours: number;
  wfh: boolean;
}

const toUtc = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
const sameMonthDay = (a: Date, b: Date) => a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();

interface PunchLite {
  ts: Date;
  type: 'IN' | 'OUT';
  wfh: boolean;
}

// The keystone: what a day actually was, resolved against the calendar we already
// model. Precedence HOLIDAY > WEEKLY_OFF > ON_LEAVE > PRESENT/WFH > ABSENT.
function resolveDay(
  date: string,
  workweek: DayName[],
  holidays: { date: string; isRecurring: boolean }[],
  leaves: { startDate: string; endDate: string }[],
  punches: PunchLite[]
): DayAttendance {
  const d = toUtc(date);
  const ins = punches
    .filter((p) => p.type === 'IN')
    .map((p) => p.ts.getTime())
    .sort((a, b) => a - b);
  const outs = punches
    .filter((p) => p.type === 'OUT')
    .map((p) => p.ts.getTime())
    .sort((a, b) => a - b);
  const firstIn = ins.length ? new Date(ins[0]).toISOString() : null;
  const lastOut = outs.length ? new Date(outs[outs.length - 1]).toISOString() : null;
  const hours = ins.length && outs.length ? Math.round(((outs[outs.length - 1] - ins[0]) / 3_600_000) * 100) / 100 : 0;
  const wfh = punches.some((p) => p.wfh);

  let status: AttendanceStatus;
  const isHoliday = holidays.some((h) => {
    const hd = toUtc(h.date);
    return h.isRecurring ? sameMonthDay(hd, d) : hd.getTime() === d.getTime();
  });
  if (isHoliday) status = 'HOLIDAY';
  else if (!workweek.includes(DAY_NAMES[d.getUTCDay()])) status = 'WEEKLY_OFF';
  else if (leaves.some((l) => l.startDate <= date && l.endDate >= date)) status = 'ON_LEAVE';
  else status = punches.length ? (wfh ? 'WFH' : 'PRESENT') : 'ABSENT';
  return { date, status, firstIn, lastOut, hours, wfh };
}

// The person's effective workweek + location (user → team → default), reused by the resolver.
async function loadCalendar(orgId: string, userId: string): Promise<{ workweek: DayName[]; location: string | null }> {
  const [u] = await db
    .select({ workweek: schema.user.workweek, teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  let teamWorkweek: DayName[] | null = null;
  let location: string | null = null;
  if (u?.teamId) {
    const [t] = await db
      .select({ workweek: schema.team.workweek, location: schema.team.location })
      .from(schema.team)
      .where(eq(schema.team.teamId, u.teamId))
      .limit(1);
    teamWorkweek = (t?.workweek ?? null) as DayName[] | null;
    location = t?.location ?? null;
  }
  const workweek =
    u?.workweek && u.workweek.length > 0 ? (u.workweek as DayName[]) : (teamWorkweek ?? DEFAULT_WORKWEEK);
  if (!location) {
    const [o] = await db
      .select({ location: schema.organisation.location })
      .from(schema.organisation)
      .where(eq(schema.organisation.orgId, orgId))
      .limit(1);
    location = o?.location?.[0] ?? null;
  }
  return { workweek, location };
}

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  for (const d = toUtc(from); d <= toUtc(to); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

export interface RecordPunchInput {
  type: 'IN' | 'OUT';
  ts?: string; // defaults to now
  wfh?: boolean;
  location?: string;
}

// Self check-in/out. (Device/manager-on-behalf is a later source.)
export async function recordPunch(ctx: AuthContext, input: RecordPunchInput): Promise<AttendancePunch> {
  const [row] = await db
    .insert(schema.attendancePunch)
    .values({
      orgId: ctx.orgId,
      userId: ctx.userId ?? '',
      ts: input.ts ? new Date(input.ts) : new Date(),
      type: input.type,
      source: 'WEB',
      wfh: input.wfh ?? false,
      location: input.location ?? null,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

// Resolved daily attendance over [from,to]. Self, or MANAGER+ for others. Loads the
// calendar + leaves + punches once and resolves each date in memory.
export async function listAttendance(
  ctx: AuthContext,
  userId: string,
  from: string,
  to: string
): Promise<DayAttendance[]> {
  if (userId !== ctx.userId) requireRole(ctx, 'MANAGER');
  const { workweek, location } = await loadCalendar(ctx.orgId, userId);
  const holidays = await resolveHolidays(ctx.orgId, location, Number(from.slice(0, 4)), Number(to.slice(0, 4)));
  const leaves = await db
    .select({ startDate: schema.leave.startDate, endDate: schema.leave.endDate })
    .from(schema.leave)
    .where(
      and(
        eq(schema.leave.userId, userId),
        eq(schema.leave.isApproved, 'APPROVED'),
        lte(schema.leave.startDate, to),
        gte(schema.leave.endDate, from)
      )
    );
  const punchRows = await db
    .select({ ts: schema.attendancePunch.ts, type: schema.attendancePunch.type, wfh: schema.attendancePunch.wfh })
    .from(schema.attendancePunch)
    .where(
      and(
        eq(schema.attendancePunch.userId, userId),
        gte(schema.attendancePunch.ts, toUtc(from)),
        lte(schema.attendancePunch.ts, new Date(toUtc(to).getTime() + 86_400_000))
      )
    );
  const byDate = new Map<string, PunchLite[]>();
  for (const p of punchRows) {
    const key = p.ts.toISOString().slice(0, 10);
    const arr = byDate.get(key) ?? [];
    arr.push({ ts: p.ts, type: p.type as 'IN' | 'OUT', wfh: p.wfh });
    byDate.set(key, arr);
  }
  return eachDate(from, to).map((date) => resolveDay(date, workweek, holidays, leaves, byDate.get(date) ?? []));
}

// A manager's team, with each member's status today.
export async function teamToday(
  ctx: AuthContext,
  teamId: string
): Promise<
  { userId: string; name: string; status: AttendanceStatus; firstIn: string | null; lastOut: string | null }[]
> {
  requireRole(ctx, 'MANAGER');
  const members = await db
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.teamId, teamId)));
  const today = new Date().toISOString().slice(0, 10);
  return Promise.all(
    members.map(async (m) => {
      const [day] = await listAttendance(ctx, m.id, today, today);
      return { userId: m.id, name: m.name, status: day.status, firstIn: day.firstIn, lastOut: day.lastOut };
    })
  );
}
