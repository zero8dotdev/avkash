import { describe, expect, it } from 'bun:test';
import { inWindow, localTimeHHMM } from './window';

describe('inWindow', () => {
  it('same-day window 06:00–23:00', () => {
    expect(inWindow('06:00', '06:00', '23:00')).toBe(true); // boundary
    expect(inWindow('14:30', '06:00', '23:00')).toBe(true);
    expect(inWindow('05:59', '06:00', '23:00')).toBe(false); // before open
    expect(inWindow('23:30', '06:00', '23:00')).toBe(false); // after close
  });

  it('overnight window 22:00–06:00 wraps midnight', () => {
    expect(inWindow('23:30', '22:00', '06:00')).toBe(true);
    expect(inWindow('02:00', '22:00', '06:00')).toBe(true);
    expect(inWindow('12:00', '22:00', '06:00')).toBe(false); // midday is outside
  });

  it('null bounds = always open; tolerates HH:MM:SS', () => {
    expect(inWindow('03:00', null, '06:00')).toBe(true);
    expect(inWindow('03:00', '06:00', null)).toBe(true);
    expect(inWindow('14:30:00', '06:00:00', '23:00:00')).toBe(true);
  });
});

describe('localTimeHHMM', () => {
  it('converts a UTC instant to the location wall-clock', () => {
    const noonUtc = new Date('2026-06-15T12:00:00Z');
    expect(localTimeHHMM(noonUtc, 'Asia/Kolkata')).toBe('17:30'); // UTC+5:30
    expect(localTimeHHMM(noonUtc, 'UTC')).toBe('12:00');
    expect(localTimeHHMM(new Date('2026-06-15T18:30:00Z'), 'America/New_York')).toBe('14:30'); // UTC-4 (DST)
  });

  it('midnight is 00:00, not 24:00', () => {
    expect(localTimeHHMM(new Date('2026-06-15T00:00:00Z'), 'UTC')).toBe('00:00');
  });
});
