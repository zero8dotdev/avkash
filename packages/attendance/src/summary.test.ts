import { describe, expect, it } from 'bun:test';
import { summarize } from './summary';
import type { DayAttendance } from './attendance';

const day = (status: DayAttendance['status'], marks: string[] = [], hours = 0, overtimeHours = 0): DayAttendance => ({
  date: '2026-06-15',
  status,
  marks,
  firstIn: null,
  lastOut: null,
  hours,
  overtimeHours,
  wfh: false,
});

describe('summarize', () => {
  it('counts statuses and marks, sums hours + overtime', () => {
    const s = summarize([
      day('PRESENT', ['ON_TIME'], 8),
      day('PRESENT', ['LATE'], 7.5),
      day('PRESENT', ['OVERTIME'], 10, 2),
      day('PRESENT', ['HALF_DAY', 'EARLY_DEPARTURE'], 3),
      day('ABSENT'),
      day('ON_LEAVE'),
      day('WEEKLY_OFF'),
      day('HOLIDAY'),
    ]);
    expect(s.present).toBe(4);
    expect(s.absent).toBe(1);
    expect(s.onLeave).toBe(1);
    expect(s.weeklyOff).toBe(1);
    expect(s.holiday).toBe(1);
    expect(s.lateDays).toBe(1);
    expect(s.halfDays).toBe(1);
    expect(s.earlyDepartures).toBe(1);
    expect(s.workedHours).toBe(28.5);
    expect(s.overtimeHours).toBe(2);
  });

  it('is all-zero for an empty range', () => {
    const s = summarize([]);
    expect(s.present + s.absent + s.workedHours + s.overtimeHours).toBe(0);
  });
});
