import { describe, expect, it } from 'bun:test';
import { effectiveLocation, effectiveDepartment } from './transfers-pure';

const home = 'loc-home';
const factory1 = 'loc-factory1';
const factory2 = 'loc-factory2';

describe('effectiveLocation', () => {
  it('returns home when no transfers', () => {
    expect(effectiveLocation([], home, '2024-06-01')).toBe(home);
  });

  it('returns toLocation for an active permanent transfer', () => {
    const t = [{ toLocationId: factory1, type: 'PERMANENT', startDate: '2024-01-01', endDate: null }];
    expect(effectiveLocation(t, home, '2024-06-01')).toBe(factory1);
  });

  it('returns home when transfer has not started yet', () => {
    const t = [{ toLocationId: factory1, type: 'PERMANENT', startDate: '2025-01-01', endDate: null }];
    expect(effectiveLocation(t, home, '2024-06-01')).toBe(home);
  });

  it('returns home when temporary transfer has ended', () => {
    const t = [{ toLocationId: factory1, type: 'TEMPORARY', startDate: '2024-01-01', endDate: '2024-03-31' }];
    expect(effectiveLocation(t, home, '2024-06-01')).toBe(home);
  });

  it('prefers TEMPORARY over PERMANENT when both active', () => {
    const transfers = [
      { toLocationId: factory1, type: 'PERMANENT', startDate: '2024-01-01', endDate: null },
      { toLocationId: factory2, type: 'TEMPORARY', startDate: '2024-05-01', endDate: '2024-07-31' },
    ];
    expect(effectiveLocation(transfers, home, '2024-06-01')).toBe(factory2);
  });
});

describe('effectiveDepartment', () => {
  const dept1 = 'dept-production';
  const dept2 = 'dept-maintenance';

  it('returns home dept when no transfers', () => {
    expect(effectiveDepartment([], dept1, '2024-06-01')).toBe(dept1);
  });

  it('returns toDepartmentId for active transfer', () => {
    const t = [
      { toLocationId: home, toDepartmentId: dept2, type: 'PERMANENT', startDate: '2024-01-01', endDate: null },
    ];
    expect(effectiveDepartment(t, dept1, '2024-06-01')).toBe(dept2);
  });

  it('returns home dept when toDepartmentId is null', () => {
    const t = [{ toLocationId: home, toDepartmentId: null, type: 'PERMANENT', startDate: '2024-01-01', endDate: null }];
    expect(effectiveDepartment(t, dept1, '2024-06-01')).toBe(dept1);
  });
});
