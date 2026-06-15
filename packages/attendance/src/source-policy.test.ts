import { describe, expect, it } from 'bun:test';
import { isSourceAllowed } from './source-policy-pure';

describe('isSourceAllowed', () => {
  it('allows SLACK regardless of policy (bypass source)', () => {
    expect(isSourceAllowed(['WEB'], 'SLACK')).toBe(true);
  });

  it('allows REGULARIZATION regardless of policy (bypass source)', () => {
    expect(isSourceAllowed(['DEVICE'], 'REGULARIZATION')).toBe(true);
  });

  it('allows all sources when no policy (null = permissive)', () => {
    expect(isSourceAllowed(null, 'WEB')).toBe(true);
    expect(isSourceAllowed(null, 'DEVICE')).toBe(true);
  });

  it('allows a source that is in the policy', () => {
    expect(isSourceAllowed(['WEB', 'DEVICE'], 'WEB')).toBe(true);
    expect(isSourceAllowed(['DEVICE'], 'DEVICE')).toBe(true);
  });

  it('blocks a source not in the policy', () => {
    expect(isSourceAllowed(['DEVICE'], 'WEB')).toBe(false);
    expect(isSourceAllowed(['WEB'], 'DEVICE')).toBe(false);
  });

  it('empty allowed list blocks all non-bypass sources', () => {
    expect(isSourceAllowed([], 'WEB')).toBe(false);
    expect(isSourceAllowed([], 'DEVICE')).toBe(false);
  });
});
