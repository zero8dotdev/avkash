// Pure helpers for attendance source policy. No DB imports.
// With OrgLevel replacing the hardcoded enum, there are no built-in defaults per level.
// When no policy row exists for a level → all sources are allowed (permissive default).

export type AttendanceSource = 'WEB' | 'SLACK' | 'DEVICE' | 'REGULARIZATION';

const BYPASS_SOURCES = new Set<AttendanceSource>(['SLACK', 'REGULARIZATION']);

export function isBypassSource(source: AttendanceSource): boolean {
  return BYPASS_SOURCES.has(source);
}

// Is this source allowed given the policy for this user's level?
// `allowedSources = null` means no policy configured → permissive (all allowed).
export function isSourceAllowed(allowedSources: AttendanceSource[] | null, source: AttendanceSource): boolean {
  if (isBypassSource(source)) return true;
  if (allowedSources == null) return true;
  return allowedSources.includes(source);
}
