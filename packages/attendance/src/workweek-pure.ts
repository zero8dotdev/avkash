// Pure helpers for rotating workweek patterns (Plan 32).
// No DB imports — safe to import in tests and edge workers.

export type WorkweekPatternRecord = {
  cycleLength: number;
  weeks: string[][];
  referenceDate: string; // ISO date, any Monday in the past
};

// Number of whole ISO weeks elapsed since the reference Monday.
function weeksSinceReference(referenceDate: string, targetDate: string): number {
  const ref = new Date(referenceDate);
  const target = new Date(targetDate);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - ref.getTime()) / msPerWeek);
}

// Which week-slot in the cycle does `date` land in?
// cycleLength=2 → alternating fortnightly; cycleLength=4 → monthly.
export function cycleWeekIndex(pattern: WorkweekPatternRecord, date: string): number {
  const elapsed = weeksSinceReference(pattern.referenceDate, date);
  return ((elapsed % pattern.cycleLength) + pattern.cycleLength) % pattern.cycleLength;
}

// The set of working day names for the week that `date` belongs to.
export function effectiveWorkdays(pattern: WorkweekPatternRecord, date: string): string[] {
  return pattern.weeks[cycleWeekIndex(pattern, date)] ?? [];
}

// Is `date` a working day according to the pattern?
export function isWorkday(pattern: WorkweekPatternRecord, date: string): boolean {
  const d = new Date(date);
  const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][d.getDay()];
  return effectiveWorkdays(pattern, date).includes(dayName);
}

// Count working days between startDate (inclusive) and endDate (inclusive).
export function countWorkdays(pattern: WorkweekPatternRecord, startDate: string, endDate: string): number {
  let count = 0;
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    if (isWorkday(pattern, iso)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
