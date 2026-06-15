import { describe, expect, it } from 'bun:test';
import { pickTimezone } from './tz';

describe('pickTimezone', () => {
  it('takes the first non-empty candidate (the inherit cascade)', () => {
    expect(pickTimezone('Asia/Kolkata', 'Europe/London')).toBe('Asia/Kolkata'); // user wins
    expect(pickTimezone(null, 'Europe/London')).toBe('Europe/London'); // falls to team
    expect(pickTimezone(undefined, null, 'America/New_York')).toBe('America/New_York'); // legacy team tz
  });

  it('skips empty strings, not just null/undefined', () => {
    expect(pickTimezone('', 'Asia/Kolkata')).toBe('Asia/Kolkata');
  });

  it('defaults to UTC when nothing is set', () => {
    expect(pickTimezone(null, undefined, '')).toBe('UTC');
    expect(pickTimezone()).toBe('UTC');
  });
});
