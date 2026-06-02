// Prorate a non-accrual (upfront-grant) annual entitlement for a mid-year joiner:
// completed months from the join month, with a 15th-of-month cutoff (joined on/before
// the 15th → that month counts), rounded UP to the nearest half-day.
//
// Accrual policies do NOT use this — they self-prorate (a July joiner only accrues
// from July). Only the join year is partial; later years are full.
export function proratedEntitlement(maxLeaves: number, joinedOn: string, year: number): number {
  const [jy, jm, jd] = joinedOn.slice(0, 10).split('-').map(Number);
  if (year < jy) return 0; // not yet employed that year
  if (year > jy) return maxLeaves; // full year
  const startMonth = jd <= 15 ? jm : jm + 1;
  const monthsRemaining = Math.max(0, 13 - startMonth);
  return Math.ceil(((maxLeaves * monthsRemaining) / 12) * 2) / 2;
}
