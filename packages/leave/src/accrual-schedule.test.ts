import { describe, expect, it } from 'bun:test';
import { accrualOccursOn, nextAccrualOn, periodKeyFor, type AccrualSchedule } from './accrual-schedule';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const policy = (accrualFrequency: AccrualSchedule['accrualFrequency'], accrueOn: AccrualSchedule['accrueOn']) => ({
  accrualFrequency,
  accrueOn,
});

describe('accrualOccursOn', () => {
  it('monthly BEGINNING fires only on the 1st', () => {
    const p = policy('MONTHLY', 'BEGINNING');
    expect(accrualOccursOn(p, d('2026-06-01'))).toBe(true);
    expect(accrualOccursOn(p, d('2026-06-02'))).toBe(false);
    expect(accrualOccursOn(p, d('2026-06-30'))).toBe(false);
  });

  it('monthly END fires on the last day, including short/leap months', () => {
    const p = policy('MONTHLY', 'END');
    expect(accrualOccursOn(p, d('2026-06-30'))).toBe(true); // 30-day month
    expect(accrualOccursOn(p, d('2026-07-31'))).toBe(true); // 31-day month
    expect(accrualOccursOn(p, d('2026-02-28'))).toBe(true); // non-leap Feb
    expect(accrualOccursOn(p, d('2028-02-29'))).toBe(true); // leap Feb
    expect(accrualOccursOn(p, d('2028-02-28'))).toBe(false); // not last in a leap year
  });

  it('quarterly BEGINNING fires on the 1st of Jan/Apr/Jul/Oct only', () => {
    const p = policy('QUARTERLY', 'BEGINNING');
    for (const m of ['01', '04', '07', '10']) expect(accrualOccursOn(p, d(`2026-${m}-01`))).toBe(true);
    expect(accrualOccursOn(p, d('2026-02-01'))).toBe(false); // mid-quarter month
    expect(accrualOccursOn(p, d('2026-04-02'))).toBe(false); // right month, wrong day
  });

  it('quarterly END fires on the last day of Mar/Jun/Sep/Dec only', () => {
    const p = policy('QUARTERLY', 'END');
    for (const day of ['03-31', '06-30', '09-30', '12-31']) expect(accrualOccursOn(p, d(`2026-${day}`))).toBe(true);
    expect(accrualOccursOn(p, d('2026-03-30'))).toBe(false);
    expect(accrualOccursOn(p, d('2026-05-31'))).toBe(false); // mid-quarter month
  });

  it('null accrueOn defaults to BEGINNING; null frequency never fires', () => {
    expect(accrualOccursOn(policy('MONTHLY', null), d('2026-06-01'))).toBe(true);
    expect(accrualOccursOn(policy(null, 'BEGINNING'), d('2026-06-01'))).toBe(false);
  });
});

describe('nextAccrualOn', () => {
  it('is inclusive of today when today is a credit day', () => {
    expect(nextAccrualOn(policy('MONTHLY', 'BEGINNING'), d('2026-06-01'))!.toISOString().slice(0, 10)).toBe(
      '2026-06-01'
    );
  });

  it('finds the next month start from mid-month', () => {
    expect(nextAccrualOn(policy('MONTHLY', 'BEGINNING'), d('2026-06-15'))!.toISOString().slice(0, 10)).toBe(
      '2026-07-01'
    );
  });

  it('finds the next quarter end across months', () => {
    expect(nextAccrualOn(policy('QUARTERLY', 'END'), d('2026-04-15'))!.toISOString().slice(0, 10)).toBe('2026-06-30');
  });

  it('rolls into the next year', () => {
    expect(nextAccrualOn(policy('MONTHLY', 'BEGINNING'), d('2026-12-15'))!.toISOString().slice(0, 10)).toBe(
      '2027-01-01'
    );
    expect(nextAccrualOn(policy('QUARTERLY', 'BEGINNING'), d('2026-11-01'))!.toISOString().slice(0, 10)).toBe(
      '2027-01-01'
    );
  });

  it('returns null for a non-accruing policy', () => {
    expect(nextAccrualOn(policy(null, null), d('2026-06-15'))).toBeNull();
  });
});

describe('periodKeyFor', () => {
  it('identifies the period independent of the anchor day', () => {
    expect(periodKeyFor('MONTHLY', d('2026-06-01'))).toBe('accrual:2026-06');
    expect(periodKeyFor('MONTHLY', d('2026-06-30'))).toBe('accrual:2026-06'); // same period, END anchor
    expect(periodKeyFor('QUARTERLY', d('2026-06-30'))).toBe('accrual:2026-Q2');
  });
});
