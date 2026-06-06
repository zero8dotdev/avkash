import { describe, expect, it } from 'bun:test';
import { isWorkday, countWorkdays, cycleWeekIndex, effectiveWorkdays } from './workweek-pure';

const altSat = {
  cycleLength: 2,
  // week 0: Mon–Fri only (Saturday off); week 1: Mon–Sat (Saturday on)
  weeks: [
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  ],
  referenceDate: '2024-01-01', // known Monday
};

describe('cycleWeekIndex', () => {
  it('returns 0 in the reference week', () => {
    expect(cycleWeekIndex(altSat, '2024-01-01')).toBe(0);
    expect(cycleWeekIndex(altSat, '2024-01-05')).toBe(0); // Friday same week
  });

  it('returns 1 in the second week', () => {
    expect(cycleWeekIndex(altSat, '2024-01-08')).toBe(1); // next Monday
    expect(cycleWeekIndex(altSat, '2024-01-13')).toBe(1); // Saturday
  });

  it('wraps back to 0 in the third week', () => {
    expect(cycleWeekIndex(altSat, '2024-01-15')).toBe(0);
  });
});

describe('isWorkday', () => {
  it('Saturday is off in week 0', () => {
    expect(isWorkday(altSat, '2024-01-06')).toBe(false); // Sat, week 0
  });

  it('Saturday is on in week 1', () => {
    expect(isWorkday(altSat, '2024-01-13')).toBe(true); // Sat, week 1
  });

  it('Sunday is always off', () => {
    expect(isWorkday(altSat, '2024-01-07')).toBe(false); // Sun week 0
    expect(isWorkday(altSat, '2024-01-14')).toBe(false); // Sun week 1
  });

  it('weekday is always on', () => {
    expect(isWorkday(altSat, '2024-01-02')).toBe(true); // Tue
    expect(isWorkday(altSat, '2024-01-10')).toBe(true); // Wed week 1
  });
});

describe('countWorkdays', () => {
  it('counts correctly over a 2-week cycle (10 + 11 = 21 except Sun)', () => {
    // Mon 2024-01-01 → Sun 2024-01-14 (2 weeks)
    // Week 0: Mon–Fri (5) + Sat off = 5; Week 1: Mon–Fri (5) + Sat = 6 → 11
    const count = countWorkdays(altSat, '2024-01-01', '2024-01-14');
    expect(count).toBe(11);
  });

  it('single day counts 1 if workday, 0 if not', () => {
    expect(countWorkdays(altSat, '2024-01-06', '2024-01-06')).toBe(0); // off-Sat week 0
    expect(countWorkdays(altSat, '2024-01-13', '2024-01-13')).toBe(1); // on-Sat week 1
  });
});

describe('effectiveWorkdays', () => {
  it('returns the correct day set for each week slot', () => {
    expect(effectiveWorkdays(altSat, '2024-01-01')).toEqual(altSat.weeks[0]);
    expect(effectiveWorkdays(altSat, '2024-01-08')).toEqual(altSat.weeks[1]);
  });
});
