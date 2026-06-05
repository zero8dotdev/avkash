import type { DayAttendance } from './attendance'; // type-only → no runtime DB import

export interface AttendanceSummary {
  present: number;
  absent: number;
  onLeave: number;
  weeklyOff: number;
  holiday: number;
  wfh: number;
  halfDays: number;
  lateDays: number;
  earlyDepartures: number;
  workedHours: number;
  overtimeHours: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Pure fold over resolved days → counts. The summary that powers late/absence/OT
// reporting without re-resolving anything. Unit-tested (no DB).
export function summarize(days: DayAttendance[]): AttendanceSummary {
  const s: AttendanceSummary = {
    present: 0,
    absent: 0,
    onLeave: 0,
    weeklyOff: 0,
    holiday: 0,
    wfh: 0,
    halfDays: 0,
    lateDays: 0,
    earlyDepartures: 0,
    workedHours: 0,
    overtimeHours: 0,
  };
  for (const d of days) {
    if (d.status === 'PRESENT') s.present += 1;
    else if (d.status === 'ABSENT') s.absent += 1;
    else if (d.status === 'ON_LEAVE') s.onLeave += 1;
    else if (d.status === 'WEEKLY_OFF') s.weeklyOff += 1;
    else if (d.status === 'HOLIDAY') s.holiday += 1;
    else if (d.status === 'WFH') s.wfh += 1;
    if (d.marks.includes('HALF_DAY')) s.halfDays += 1;
    if (d.marks.includes('LATE')) s.lateDays += 1;
    if (d.marks.includes('EARLY_DEPARTURE')) s.earlyDepartures += 1;
    s.workedHours += d.hours;
    s.overtimeHours += d.overtimeHours;
  }
  s.workedHours = round2(s.workedHours);
  s.overtimeHours = round2(s.overtimeHours);
  return s;
}
