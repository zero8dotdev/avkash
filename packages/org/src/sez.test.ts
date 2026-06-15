import { describe, expect, it } from 'bun:test';
import { isSEZ } from './sez';

describe('isSEZ', () => {
  it('returns true for SEZ regime', () => {
    expect(isSEZ({ laborRegime: 'SEZ' })).toBe(true);
  });

  it('returns false for STANDARD regime', () => {
    expect(isSEZ({ laborRegime: 'STANDARD' })).toBe(false);
  });

  it('returns false for SHOP_ESTABLISHMENT', () => {
    expect(isSEZ({ laborRegime: 'SHOP_ESTABLISHMENT' })).toBe(false);
  });

  it('returns false for OTHER', () => {
    expect(isSEZ({ laborRegime: 'OTHER' })).toBe(false);
  });
});
