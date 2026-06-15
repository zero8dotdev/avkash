import { describe, expect, it } from 'bun:test';
import { isPolicyApplicable } from './applicability';

const ALL: Parameters<typeof isPolicyApplicable>[0] = {
  locationIds: null,
  departmentIds: null,
  levelIds: null,
};

describe('isPolicyApplicable', () => {
  it('applies to everyone when all scope arrays are null', () => {
    expect(isPolicyApplicable(ALL, {})).toBe(true);
    expect(isPolicyApplicable(ALL, { locationId: 'loc-1', departmentId: 'dept-1', levelId: 'lvl-1' })).toBe(true);
  });

  it('returns false when employee location not in locationIds', () => {
    const p = { ...ALL, locationIds: ['loc-1', 'loc-2'] };
    expect(isPolicyApplicable(p, { locationId: 'loc-3' })).toBe(false);
  });

  it('returns true when employee location is in locationIds', () => {
    const p = { ...ALL, locationIds: ['loc-1', 'loc-2'] };
    expect(isPolicyApplicable(p, { locationId: 'loc-1' })).toBe(true);
  });

  it('returns false when employee department not in departmentIds', () => {
    const p = { ...ALL, departmentIds: ['dept-a'] };
    expect(isPolicyApplicable(p, { departmentId: 'dept-b' })).toBe(false);
  });

  it('returns true when employee department is in departmentIds', () => {
    const p = { ...ALL, departmentIds: ['dept-a'] };
    expect(isPolicyApplicable(p, { departmentId: 'dept-a' })).toBe(true);
  });

  it('returns false when employee level not in levelIds', () => {
    const p = { ...ALL, levelIds: ['lvl-exec'] };
    expect(isPolicyApplicable(p, { levelId: 'lvl-worker' })).toBe(false);
  });

  it('returns true when employee level is in levelIds', () => {
    const p = { ...ALL, levelIds: ['lvl-exec', 'lvl-mgmt'] };
    expect(isPolicyApplicable(p, { levelId: 'lvl-exec' })).toBe(true);
  });

  it('all three dimensions must match when all are set', () => {
    const p = { locationIds: ['loc-1'], departmentIds: ['dept-a'], levelIds: ['lvl-exec'] };
    expect(isPolicyApplicable(p, { locationId: 'loc-1', departmentId: 'dept-a', levelId: 'lvl-exec' })).toBe(true);
    expect(isPolicyApplicable(p, { locationId: 'loc-1', departmentId: 'dept-a', levelId: 'lvl-worker' })).toBe(false);
    expect(isPolicyApplicable(p, { locationId: 'loc-2', departmentId: 'dept-a', levelId: 'lvl-exec' })).toBe(false);
  });

  it('treats absent employee fields as empty string (not in any non-null scope)', () => {
    const p = { ...ALL, locationIds: ['loc-1'] };
    expect(isPolicyApplicable(p, {})).toBe(false); // no locationId → treated as ''
  });
});
