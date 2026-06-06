// Pure shift math (plan 23): pairing punches into sessions and grading a worked day
// against a shift. No DB, no Date.now — fully unit-tested. Overnight shifts
// (crossesMidnight) are handled by measuring minutes-into-shift, which wraps midnight.

export interface ShiftLite {
  startTime: string; // "HH:MM[:SS]" local
  endTime: string;
  crossesMidnight: boolean;
  graceMinutes: number;
  fullDayHours: number;
  halfDayHours: number;
  isFlexible: boolean;
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

// Minutes from the shift's start to a local time. For an overnight shift, a time
// before the start (early morning) is treated as the next day (+24h).
export function minutesIntoShift(localHHMM: string, shift: { startTime: string; crossesMidnight: boolean }): number {
  const start = toMinutes(shift.startTime);
  let t = toMinutes(localHHMM);
  if (shift.crossesMidnight && t < start) t += 1440;
  return t - start;
}

export function shiftLengthMinutes(shift: { startTime: string; endTime: string; crossesMidnight: boolean }): number {
  const start = toMinutes(shift.startTime);
  let end = toMinutes(shift.endTime);
  if (shift.crossesMidnight) end += 1440;
  return end - start;
}

// Rest between a shift on day D and a shift on day D+1: minutes from the first's end
// to the second's start. Overnight-aware (a night shift ends the next morning).
export function restMinutes(prev: { endTime: string; crossesMidnight: boolean }, next: { startTime: string }): number {
  const prevEnd = toMinutes(prev.endTime) + (prev.crossesMidnight ? 1440 : 0);
  return 1440 + toMinutes(next.startTime) - prevEnd;
}

export interface PunchLite {
  ts: Date;
  type: 'IN' | 'OUT';
}
export interface Session {
  inTs: Date;
  outTs: Date | null; // null = unclosed (mis-punch / still in)
  minutes: number;
}

// Pair a punch list into IN→OUT sessions. A second IN before an OUT closes the prior
// one as unclosed (a mis-punch); a stray OUT with no open IN is ignored. Worked time
// is the sum of *closed* sessions, so punched breaks are naturally excluded.
export function pairSessions(punches: PunchLite[]): Session[] {
  const sorted = [...punches].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  const sessions: Session[] = [];
  let openIn: Date | null = null;
  for (const p of sorted) {
    if (p.type === 'IN') {
      if (openIn) sessions.push({ inTs: openIn, outTs: null, minutes: 0 });
      openIn = p.ts;
    } else if (openIn) {
      sessions.push({ inTs: openIn, outTs: p.ts, minutes: Math.round((p.ts.getTime() - openIn.getTime()) / 60000) });
      openIn = null;
    }
  }
  if (openIn) sessions.push({ inTs: openIn, outTs: null, minutes: 0 });
  return sessions;
}

// Plan 45: compute the clock-time window of each shift half for half-day leave logic.
// FIRST_HALF = shift-start to midpoint; SECOND_HALF = midpoint to shift-end.
// This is a pure function (no DB, no Date.now) — usable anywhere (resolver, UI, overlap checks).
export type HalfDayPart = 'FIRST_HALF' | 'SECOND_HALF' | 'NONE';
export interface HalfDayWindow {
  from: string; // HH:MM
  to: string;
}

export function halfDayWindow(
  shift: { startTime: string; endTime: string; crossesMidnight: boolean },
  part: HalfDayPart
): HalfDayWindow | null {
  if (part === 'NONE') return null;
  const startMin = toMinutes(shift.startTime);
  let endMin = toMinutes(shift.endTime);
  if (shift.crossesMidnight) endMin += 1440;
  const midMin = Math.floor((startMin + endMin) / 2);
  const midNorm = midMin % 1440;
  const midHHMM = `${String(Math.floor(midNorm / 60)).padStart(2, '0')}:${String(midNorm % 60).padStart(2, '0')}`;
  return part === 'FIRST_HALF'
    ? { from: shift.startTime.slice(0, 5), to: midHHMM }
    : { from: midHHMM, to: shift.endTime.slice(0, 5) };
}

// Plan 39 + Plan 38: compute overtime mark and hours from worked hours.
// trackOvertime=false → no OVERTIME mark, 0 overtimeHours (executive/management shifts).
// overtimeThresholdHours overrides fullDayHours when set (SEZ higher threshold, Plan 38).
export function applyOvertime(
  marks: string[],
  hours: number,
  trackOvertime: boolean,
  fullDayHours: number,
  overtimeThresholdHours?: number | null
): { marks: string[]; overtimeHours: number } {
  if (!trackOvertime) return { marks, overtimeHours: 0 };
  const threshold = overtimeThresholdHours ?? fullDayHours;
  const newMarks = hours > threshold ? [...marks, 'OVERTIME'] : marks;
  const overtimeHours = Math.max(0, Math.round((hours - threshold) * 100) / 100);
  return { marks: newMarks, overtimeHours };
}

// Grade a worked day: marks layered on PRESENT. OVERTIME is intentionally NOT computed
// here — it's the caller's (resolveDay's) responsibility so it can apply the
// trackOvertime flag (Plan 39) and the location-level SEZ threshold (Plan 38).
export function computeMarks(
  shift: ShiftLite,
  firstInLocal: string | null,
  lastOutLocal: string | null,
  workedHours: number
): string[] {
  const marks: string[] = [];
  if (workedHours > 0 && workedHours < shift.halfDayHours) marks.push('HALF_DAY');
  if (!shift.isFlexible) {
    if (firstInLocal && minutesIntoShift(firstInLocal, shift) > shift.graceMinutes) marks.push('LATE');
    if (lastOutLocal && minutesIntoShift(lastOutLocal, shift) < shiftLengthMinutes(shift) - shift.graceMinutes) {
      marks.push('EARLY_DEPARTURE');
    }
  }
  if (!marks.length && firstInLocal) marks.push('ON_TIME');
  return marks;
}
