// Allowed-punch-window check (plan 23): is a UTC instant inside a location's local
// window? Pure + Intl-based → unit-testable. Violations are accepted-and-flagged,
// never rejected, so this only decides the flag.

// Local wall-clock "HH:MM" for a UTC instant in an IANA timezone. hourCycle h23 so
// midnight is "00:00", never "24:00".
export function localTimeHHMM(ts: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ts);
}

// Is HH:MM inside [start, end]? Null bounds = always open. Handles overnight windows
// (start > end), e.g. 22:00–06:00 wraps midnight.
export function inWindow(hhmm: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return true;
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  const t = hhmm.slice(0, 5);
  return s <= e ? t >= s && t <= e : t >= s || t <= e;
}
