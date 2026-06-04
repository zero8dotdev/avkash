// The accrual timing spine — pure date math, no DB. One source of truth for both
// "is today a credit day?" (the cron tick) and "when is the next credit?" (the
// HR/Admin dashboard), so the two can never disagree. Fully unit-tested.
//
// Cadence is (accrualFrequency × accrueOn): MONTHLY/QUARTERLY at the BEGINNING or
// END of the period → start-of-month, end-of-month, start-of-quarter, end-of-quarter.

type Frequency = 'MONTHLY' | 'QUARTERLY';
type AccrueOn = 'BEGINNING' | 'END';

// The slice of a leave policy this module needs. Kept structural so tests (and the
// tick) can pass a real policy row or a literal without dragging in DB types.
export interface AccrualSchedule {
  accrualFrequency: Frequency | null;
  accrueOn: AccrueOn | null;
}

const lastDayOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();

// True when `date` is the policy's credit day. A null accrueOn means BEGINNING.
export function accrualOccursOn(policy: AccrualSchedule, date: Date): boolean {
  if (!policy.accrualFrequency) return false;
  const anchor: AccrueOn = policy.accrueOn ?? 'BEGINNING';
  const month = date.getUTCMonth(); // 0-11
  const day = date.getUTCDate();

  if (policy.accrualFrequency === 'MONTHLY') {
    return anchor === 'BEGINNING' ? day === 1 : day === lastDayOfMonth(date);
  }
  // QUARTERLY: quarters start at months 0,3,6,9 and end at 2,5,8,11.
  if (anchor === 'BEGINNING') return month % 3 === 0 && day === 1;
  return month % 3 === 2 && day === lastDayOfMonth(date);
}

// The first credit day on or after `from` (inclusive). Returns null only for a
// policy with no frequency. Bounded day-walk — correct across month/quarter/leap
// boundaries without special-casing them.
export function nextAccrualOn(policy: AccrualSchedule, from: Date): Date | null {
  if (!policy.accrualFrequency) return null;
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 0; i < 400; i += 1) {
    if (accrualOccursOn(policy, d)) return d;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

// Period identity for ledger idempotency: an accrual for the same period is posted
// once regardless of which anchor day fired it. e.g. "2026-06", "2026-Q2".
export function periodLabel(freq: Frequency, now: Date): string {
  const y = now.getUTCFullYear();
  if (freq === 'MONTHLY') return `${y}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${y}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

export const periodKeyFor = (freq: Frequency, now: Date) => `accrual:${periodLabel(freq, now)}`;
