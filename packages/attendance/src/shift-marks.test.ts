import { describe, expect, it } from 'bun:test';
import { applyOvertime, computeMarks, halfDayWindow, minutesIntoShift, pairSessions, restMinutes, type ShiftLite } from './shift-marks';

const day: ShiftLite = {
  startTime: '09:00',
  endTime: '17:00',
  crossesMidnight: false,
  graceMinutes: 15,
  fullDayHours: 8,
  halfDayHours: 4,
  isFlexible: false,
};
const night: ShiftLite = { ...day, startTime: '22:00', endTime: '06:00', crossesMidnight: true };
const d = (s: string) => new Date(`${s}Z`);

describe('minutesIntoShift', () => {
  it('measures from start, wrapping midnight for overnight shifts', () => {
    expect(minutesIntoShift('09:30', day)).toBe(30);
    expect(minutesIntoShift('08:45', day)).toBe(-15); // before start
    expect(minutesIntoShift('22:30', night)).toBe(30); // same evening
    expect(minutesIntoShift('02:00', night)).toBe(240); // 02:00 → 4h into a 22:00 shift
  });
});

describe('computeMarks — day shift', () => {
  it('ON_TIME within grace and full hours', () => {
    expect(computeMarks(day, '09:10', '17:05', 8)).toEqual(['ON_TIME']);
  });
  it('LATE past grace', () => {
    expect(computeMarks(day, '09:30', '17:00', 7.5)).toEqual(['LATE']);
  });
  it('EARLY_DEPARTURE before end−grace', () => {
    expect(computeMarks(day, '09:00', '15:00', 6)).toEqual(['EARLY_DEPARTURE']);
  });
  it('HALF_DAY when worked below the half-day threshold', () => {
    expect(computeMarks(day, '09:00', '12:00', 3)).toContain('HALF_DAY');
  });
  it('does not mark OVERTIME — that is resolveDay responsibility (Plan 39)', () => {
    // OVERTIME is emitted by resolveDay, which respects shift.trackOvertime.
    expect(computeMarks(day, '09:00', '19:00', 10)).not.toContain('OVERTIME');
  });
  it('LATE only when arrived late, even if also worked long hours', () => {
    const m = computeMarks(day, '09:30', '20:00', 10);
    expect(m).toContain('LATE');
    expect(m).not.toContain('OVERTIME');
  });
});

describe('computeMarks — overnight + flexible', () => {
  it('night shift: on-time when in at 22:05, out at 06:00', () => {
    expect(computeMarks(night, '22:05', '06:00', 8)).toEqual(['ON_TIME']);
  });
  it('night shift: leaving at 23:00 is EARLY_DEPARTURE', () => {
    expect(computeMarks(night, '22:00', '23:00', 1)).toContain('EARLY_DEPARTURE');
  });
  it('flexible shift: no LATE/EARLY marks, ON_TIME when worked; no OVERTIME from computeMarks', () => {
    const flex: ShiftLite = { ...day, isFlexible: true };
    expect(computeMarks(flex, '11:00', '15:00', 4)).toEqual(['ON_TIME']);
    // resolveDay adds OVERTIME when trackOvertime=true; computeMarks only returns ON_TIME here
    expect(computeMarks(flex, '11:00', '22:00', 10)).toEqual(['ON_TIME']);
  });
});

describe('restMinutes', () => {
  it('evening (15–23) → next morning (08:00) = 9h', () => {
    expect(restMinutes({ endTime: '23:00', crossesMidnight: false }, { startTime: '08:00' })).toBe(540);
  });
  it('a night shift ending next morning leaves little rest before a morning start', () => {
    // night 22:00–06:00 ends 06:00 (next day); morning starts 08:00 → 2h rest
    expect(restMinutes({ endTime: '06:00', crossesMidnight: true }, { startTime: '08:00' })).toBe(120);
  });
  it('back-to-back close→open is short rest', () => {
    expect(restMinutes({ endTime: '23:00', crossesMidnight: false }, { startTime: '08:00' })).toBeLessThan(11 * 60);
  });
});

describe('halfDayWindow — Plan 45', () => {
  const morning = { startTime: '06:00', endTime: '14:00', crossesMidnight: false };
  const night = { startTime: '22:00', endTime: '06:00', crossesMidnight: true };
  const general = { startTime: '10:30', endTime: '18:30', crossesMidnight: false };

  it('returns null for NONE', () => {
    expect(halfDayWindow(morning, 'NONE')).toBeNull();
  });

  it('FIRST_HALF of morning shift (06:00–14:00) → 06:00 to 10:00', () => {
    const w = halfDayWindow(morning, 'FIRST_HALF');
    expect(w).toEqual({ from: '06:00', to: '10:00' });
  });

  it('SECOND_HALF of morning shift (06:00–14:00) → 10:00 to 14:00', () => {
    const w = halfDayWindow(morning, 'SECOND_HALF');
    expect(w).toEqual({ from: '10:00', to: '14:00' });
  });

  it('FIRST_HALF of general shift (10:30–18:30) → 10:30 to 14:30', () => {
    const w = halfDayWindow(general, 'FIRST_HALF');
    expect(w).toEqual({ from: '10:30', to: '14:30' });
  });

  it('SECOND_HALF of general shift (10:30–18:30) → 14:30 to 18:30', () => {
    const w = halfDayWindow(general, 'SECOND_HALF');
    expect(w).toEqual({ from: '14:30', to: '18:30' });
  });

  it('night shift (22:00–06:00 crossing midnight) — FIRST_HALF midpoint is 02:00', () => {
    // 22:00 = 1320 min; 06:00 + 1440 = 1800 min; midpoint = 1560 min = 26:00 → 02:00 next day
    const w = halfDayWindow(night, 'FIRST_HALF');
    expect(w?.from).toBe('22:00');
    expect(w?.to).toBe('02:00');
  });
});

describe('applyOvertime — Plan 39 + Plan 38', () => {
  it('adds OVERTIME mark and computes overtimeHours when trackOvertime=true', () => {
    const { marks, overtimeHours } = applyOvertime(['ON_TIME'], 10, true, 8);
    expect(marks).toContain('OVERTIME');
    expect(overtimeHours).toBe(2);
  });

  it('does NOT mark OVERTIME and returns overtimeHours=0 when trackOvertime=false (executive shifts)', () => {
    const withOT = applyOvertime(['ON_TIME'], 10, true, 8);
    const withoutOT = applyOvertime(['ON_TIME'], 10, false, 8);
    expect(withOT.marks).toContain('OVERTIME');
    expect(withoutOT.marks).not.toContain('OVERTIME');
    expect(withoutOT.overtimeHours).toBe(0);
  });

  it('uses overtimeThresholdHours (SEZ Plan 38) instead of fullDayHours when provided', () => {
    // SEZ threshold = 10h; worked 10.5h — only 0.5h OT
    const { marks, overtimeHours } = applyOvertime(['ON_TIME'], 10.5, true, 8, 10);
    expect(marks).toContain('OVERTIME');
    expect(overtimeHours).toBe(0.5);
  });

  it('does not add OVERTIME when hours do not exceed threshold', () => {
    const { marks, overtimeHours } = applyOvertime(['ON_TIME'], 8, true, 8);
    expect(marks).not.toContain('OVERTIME');
    expect(overtimeHours).toBe(0);
  });

  it('handles null overtimeThresholdHours as fallback to fullDayHours', () => {
    const { marks, overtimeHours } = applyOvertime(['ON_TIME'], 9, true, 8, null);
    expect(marks).toContain('OVERTIME');
    expect(overtimeHours).toBe(1);
  });

  it('preserves existing marks and does not duplicate OVERTIME', () => {
    const { marks } = applyOvertime(['LATE'], 10, true, 8);
    expect(marks).toEqual(['LATE', 'OVERTIME']);
  });
});

describe('pairSessions', () => {
  it('pairs IN→OUT and sums only closed sessions (breaks excluded)', () => {
    const s = pairSessions([
      { ts: d('2026-06-15T09:00:00'), type: 'IN' },
      { ts: d('2026-06-15T13:00:00'), type: 'OUT' }, // 4h
      { ts: d('2026-06-15T14:00:00'), type: 'IN' }, // 1h lunch gap, excluded
      { ts: d('2026-06-15T17:00:00'), type: 'OUT' }, // 3h
    ]);
    expect(s.map((x) => x.minutes)).toEqual([240, 180]);
  });
  it('leaves a forgotten punch-out as an unclosed session', () => {
    const s = pairSessions([{ ts: d('2026-06-15T09:00:00'), type: 'IN' }]);
    expect(s).toHaveLength(1);
    expect(s[0].outTs).toBeNull();
  });
  it('pairs an overnight session across midnight', () => {
    const s = pairSessions([
      { ts: d('2026-06-15T22:00:00'), type: 'IN' },
      { ts: d('2026-06-16T06:00:00'), type: 'OUT' },
    ]);
    expect(s[0].minutes).toBe(480); // 8h
  });
});
