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

// Grade a worked day: marks layered on PRESENT. A flexible shift only earns OVERTIME.
export function computeMarks(
  shift: ShiftLite,
  firstInLocal: string | null,
  lastOutLocal: string | null,
  workedHours: number
): string[] {
  const marks: string[] = [];
  if (workedHours > shift.fullDayHours) marks.push('OVERTIME');
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
