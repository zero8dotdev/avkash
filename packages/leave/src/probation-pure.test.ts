import { describe, expect, it } from 'bun:test';
import { applyProbationOverlay, effectiveAccrualRate, probationAccrualsEnabled } from './probation-pure';
import type { PolicyBase } from './probation-pure';

const base: PolicyBase = {
  maxLeaves: 12,
  accruals: true,
  encashable: true,
  probationMaxLeaves: null,
  probationAccruals: null,
  probationAccrualRate: null,
  probationEncashable: null,
};

describe('applyProbationOverlay', () => {
  it('returns the policy unchanged for non-PROBATION statuses', () => {
    for (const status of ['ACTIVE', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED', 'ON_LONG_LEAVE'] as const) {
      const result = applyProbationOverlay(base, status);
      expect(result).toBe(base); // same reference, no copy
    }
  });

  it('returns the base policy unchanged when all probation fields are null', () => {
    const result = applyProbationOverlay(base, 'PROBATION');
    expect(result.maxLeaves).toBe(12);
    expect(result.accruals).toBe(true);
    expect(result.encashable).toBe(true);
  });

  it('overrides maxLeaves with probationMaxLeaves when set', () => {
    const p: PolicyBase = { ...base, probationMaxLeaves: 6 };
    const result = applyProbationOverlay(p, 'PROBATION');
    expect(result.maxLeaves).toBe(6);
    expect(result.accruals).toBe(true); // unchanged
  });

  it('overrides accruals with probationAccruals=false (disables accruals during probation)', () => {
    const p: PolicyBase = { ...base, probationAccruals: false };
    const result = applyProbationOverlay(p, 'PROBATION');
    expect(result.accruals).toBe(false);
  });

  it('overrides encashable with probationEncashable=false', () => {
    const p: PolicyBase = { ...base, probationEncashable: false };
    const result = applyProbationOverlay(p, 'PROBATION');
    expect(result.encashable).toBe(false);
  });

  it('overrides all three fields simultaneously', () => {
    const p: PolicyBase = { ...base, probationMaxLeaves: 3, probationAccruals: false, probationEncashable: false };
    const result = applyProbationOverlay(p, 'PROBATION');
    expect(result.maxLeaves).toBe(3);
    expect(result.accruals).toBe(false);
    expect(result.encashable).toBe(false);
  });

  it('does not mutate the original policy', () => {
    const p: PolicyBase = { ...base, probationMaxLeaves: 5 };
    applyProbationOverlay(p, 'PROBATION');
    expect(p.maxLeaves).toBe(12); // original untouched
  });
});

describe('probationAccrualsEnabled', () => {
  it('returns true for ACTIVE employees whose policy has accruals=true', () => {
    expect(probationAccrualsEnabled(base, 'ACTIVE')).toBe(true);
  });

  it('returns false when probationAccruals=false for a PROBATION employee', () => {
    expect(probationAccrualsEnabled({ ...base, probationAccruals: false }, 'PROBATION')).toBe(false);
  });

  it('returns true when probationAccruals=true explicitly for a PROBATION employee', () => {
    expect(probationAccrualsEnabled({ ...base, probationAccruals: true }, 'PROBATION')).toBe(true);
  });

  it('falls back to base accruals when probationAccruals is null', () => {
    // base.probationAccruals is null, base.accruals is true
    expect(probationAccrualsEnabled(base, 'PROBATION')).toBe(true);
  });

  it('returns false when base accruals=false and no override', () => {
    expect(probationAccrualsEnabled({ ...base, accruals: false }, 'PROBATION')).toBe(false);
  });
});

describe('effectiveAccrualRate', () => {
  it('returns the base rate for non-PROBATION employees', () => {
    expect(effectiveAccrualRate('1.00', { probationAccrualRate: '0.50' }, 'ACTIVE')).toBe('1.00');
  });

  it('returns probationAccrualRate for PROBATION employees when set', () => {
    expect(effectiveAccrualRate('1.00', { probationAccrualRate: '0.50' }, 'PROBATION')).toBe('0.50');
  });

  it('returns base rate for PROBATION when probationAccrualRate is null', () => {
    expect(effectiveAccrualRate('1.00', { probationAccrualRate: null }, 'PROBATION')).toBe('1.00');
  });

  it('returns null when both base and probation rates are absent', () => {
    expect(effectiveAccrualRate(null, { probationAccrualRate: null }, 'PROBATION')).toBeNull();
    expect(effectiveAccrualRate(null, {}, 'ACTIVE')).toBeNull();
  });
});
