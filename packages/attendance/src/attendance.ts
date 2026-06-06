import { and, eq, gte, lte } from 'drizzle-orm';
import { db, schema, type Shift } from '@avkash/db';
import { type AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { resolveHolidays } from '@avkash/holidays';
import { getEmployeeLevel } from '@avkash/users';
import { effectiveTimezone } from './tz';
import { localTimeHHMM } from './window';
import { shiftForDate } from './shift';
import { applyOvertime, computeMarks, pairSessions, type PunchLite, type Session, type ShiftLite } from './shift-marks';
import { assertSourceAllowed } from './source-policy';

type AttendancePunch = typeof schema.attendancePunch.$inferSelect;

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
type DayName = (typeof DAY_NAMES)[number];
const DEFAULT_WORKWEEK: DayName[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'WFH' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF';
export interface DayAttendance {
  date: string; // YYYY-MM-DD (location-local)
  status: AttendanceStatus;
  marks: string[]; // LATE / EARLY_DEPARTURE / HALF_DAY / OVERTIME / ON_TIME (shift-aware)
  firstIn: string | null; // ISO
  lastOut: string | null;
  hours: number; // worked hours = Σ paired sessions
  overtimeHours: number;
  wfh: boolean;
}

const toUtc = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
const sameMonthDay = (a: Date, b: Date) => a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
// Local calendar date "YYYY-MM-DD" for a UTC instant in a timezone (en-CA → ISO order).
const localDateStr = (ts: Date, tz: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ts);

const shiftLite = (s: Shift): ShiftLite => ({
  startTime: s.startTime,
  endTime: s.endTime,
  crossesMidnight: s.crossesMidnight,
  graceMinutes: s.graceMinutes,
  fullDayHours: Number(s.fullDayHours),
  halfDayHours: Number(s.halfDayHours),
  isFlexible: s.isFlexible,
});

// The keystone (v2): what a day actually was. Precedence unchanged at the top
// (HOLIDAY > WEEKLY_OFF > ON_LEAVE > worked > ABSENT); under "worked" we now compute
// hours from paired sessions and shift-aware marks, all in the location timezone.
function resolveDay(
  date: string,
  tz: string,
  workweek: DayName[],
  holidays: { date: string; isRecurring: boolean }[],
  leaves: { startDate: string; endDate: string }[],
  shift: Shift | null,
  sessions: Session[],
  wfh: boolean,
  // Plan 38: SEZ locations may have a higher OT threshold (null = use shift.fullDayHours).
  overtimeThresholdHours?: number | null
): DayAttendance {
  const closed = sessions.filter((s) => s.outTs);
  const workedMin = closed.reduce((sum, s) => sum + s.minutes, 0);
  const hours = Math.round((workedMin / 60) * 100) / 100;
  const firstInTs = sessions.length ? sessions[0].inTs : null;
  const lastOutTs = closed.length ? closed[closed.length - 1].outTs : null;
  const firstIn = firstInTs ? firstInTs.toISOString() : null;
  const lastOut = lastOutTs ? lastOutTs.toISOString() : null;

  let marks: string[] = [];
  let overtimeHours = 0;
  if (shift && sessions.length) {
    const lite = shiftLite(shift);
    marks = computeMarks(
      lite,
      firstInTs ? localTimeHHMM(firstInTs, tz) : null,
      lastOutTs ? localTimeHHMM(lastOutTs, tz) : null,
      hours
    );
    // Plan 39 + 38: applyOvertime respects trackOvertime flag and SEZ threshold.
    ({ marks, overtimeHours } = applyOvertime(marks, hours, shift.trackOvertime, lite.fullDayHours, overtimeThresholdHours));
  }

  // The calendar checks (holiday/weekly-off/leave) use the local date.
  const d = toUtc(date);
  let status: AttendanceStatus;
  const isHoliday = holidays.some((h) => {
    const hd = toUtc(h.date);
    return h.isRecurring ? sameMonthDay(hd, d) : hd.getTime() === d.getTime();
  });
  if (isHoliday) status = 'HOLIDAY';
  else if (!workweek.includes(DAY_NAMES[d.getUTCDay()])) status = 'WEEKLY_OFF';
  else if (leaves.some((l) => l.startDate <= date && l.endDate >= date)) status = 'ON_LEAVE';
  else status = sessions.length ? (wfh ? 'WFH' : 'PRESENT') : 'ABSENT';

  return { date, status, marks, firstIn, lastOut, hours, overtimeHours, wfh };
}

// The person's effective workweek (user → team → default). Timezone comes from
// effectiveTimezone (location-aware); the holiday set keeps the legacy location string.
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

// Self check-in/out. (Device ingest is @avkash/attendance/device; both feed the same log.)
export async function recordPunch(
  ctx: AuthContext,
  input: RecordPunchInput,
  source: 'WEB' | 'SLACK' = 'WEB'
): Promise<AttendancePunch> {
  // Plan 31: enforce source eligibility based on org-defined level.
  const level = await getEmployeeLevel(ctx.orgId, ctx.userId ?? '');
  await assertSourceAllowed(ctx.orgId, level?.id ?? null, source);
  // Plan 40: WEB punches from confirmation-required levels are held pending manager review.
  const needsConfirmation = source === 'WEB' && (level?.requiresPunchConfirmation ?? false);
  const [row] = await db
    .insert(schema.attendancePunch)
    .values({
      orgId: ctx.orgId,
      userId: ctx.userId ?? '',
      ts: input.ts ? new Date(input.ts) : new Date(),
      type: input.type,
      source,
      wfh: input.wfh ?? false,
      location: input.location ?? null,
      confirmationStatus: needsConfirmation ? 'PENDING_CONFIRMATION' : null,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

// Resolved daily attendance over [from,to]. Self, or MANAGER+ for others. Punches are
// paired into sessions globally, then each session is attributed to the LOCAL date of
// its IN (so an overnight session counts on the day it started); each date is then
// resolved against its shift in the location timezone.
export async function listAttendance(
  ctx: AuthContext,
  userId: string,
  from: string,
  to: string
): Promise<DayAttendance[]> {
  if (userId !== ctx.userId) requireRole(ctx, 'MANAGER');
  const tz = await effectiveTimezone(userId);
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
  // Fetch location's SEZ overtime threshold (Plan 38 + 39).
  const [userLoc] = await db
    .select({ locationId: schema.user.locationId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  let otThreshold: number | null = null;
  if (userLoc?.locationId) {
    const [loc] = await db
      .select({ t: schema.location.overtimeThresholdHours })
      .from(schema.location)
      .where(eq(schema.location.id, userLoc.locationId))
      .limit(1);
    otThreshold = loc?.t != null ? Number(loc.t) : null;
  }

  // Widen the punch window a day each side so overnight sessions at the edges pair.
  // Plan 42: join device to get context; WEB/SLACK punches (no deviceId) → ENTRY_EXIT.
  // Plan 40: exclude PENDING_CONFIRMATION and REJECTED punches from session pairing.
  const punchRows = await db
    .select({
      ts: schema.attendancePunch.ts,
      type: schema.attendancePunch.type,
      wfh: schema.attendancePunch.wfh,
      confirmationStatus: schema.attendancePunch.confirmationStatus,
      deviceContext: schema.device.context,
    })
    .from(schema.attendancePunch)
    .leftJoin(schema.device, eq(schema.device.id, schema.attendancePunch.deviceId))
    .where(
      and(
        eq(schema.attendancePunch.userId, userId),
        gte(schema.attendancePunch.ts, new Date(toUtc(from).getTime() - 86_400_000)),
        lte(schema.attendancePunch.ts, new Date(toUtc(to).getTime() + 2 * 86_400_000))
      )
    );

  // Only ENTRY_EXIT-context punches that are not pending/rejected feed into session pairing.
  const sessionablePunches = punchRows.filter(
    (p) =>
      (p.deviceContext === null || p.deviceContext === 'ENTRY_EXIT') &&
      p.confirmationStatus !== 'PENDING_CONFIRMATION' &&
      p.confirmationStatus !== 'REJECTED'
  );
  const sessions = pairSessions(sessionablePunches.map((p): PunchLite => ({ ts: p.ts, type: p.type as 'IN' | 'OUT' })));
  // Attribute each session + wfh to the local date of its IN punch.
  const byDate = new Map<string, Session[]>();
  const wfhByDate = new Map<string, boolean>();
  for (const s of sessions) {
    const key = localDateStr(s.inTs, tz);
    (byDate.get(key) ?? byDate.set(key, []).get(key)!).push(s);
  }
  for (const p of punchRows) {
    if (p.wfh) wfhByDate.set(localDateStr(p.ts, tz), true);
  }
  // Inform caller about pending punches per date (Plan 40 informational mark).
  const pendingByDate = new Map<string, number>();
  for (const p of punchRows) {
    if (p.confirmationStatus === 'PENDING_CONFIRMATION') {
      const k = localDateStr(p.ts, tz);
      pendingByDate.set(k, (pendingByDate.get(k) ?? 0) + 1);
    }
  }

  const dates = eachDate(from, to);
  const shifts = await Promise.all(dates.map((date) => shiftForDate(ctx.orgId, userId, date)));
  return dates.map((date, i) => {
    const day = resolveDay(
      date,
      tz,
      workweek,
      holidays,
      leaves,
      shifts[i],
      byDate.get(date) ?? [],
      wfhByDate.get(date) ?? false,
      otThreshold
    );
    const pending = pendingByDate.get(date) ?? 0;
    if (pending > 0) {
      day.marks = [...day.marks, 'PUNCH_PENDING_CONFIRMATION'];
    }
    return day;
  });
}

// A manager's team, with each member's status today.
export async function teamToday(
  ctx: AuthContext,
  teamId: string
): Promise<
  {
    userId: string;
    name: string;
    status: AttendanceStatus;
    marks: string[];
    firstIn: string | null;
    lastOut: string | null;
  }[]
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
      return {
        userId: m.id,
        name: m.name,
        status: day.status,
        marks: day.marks,
        firstIn: day.firstIn,
        lastOut: day.lastOut,
      };
    })
  );
}
