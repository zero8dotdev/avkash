// attendance domain — punches + the daily resolver (workweek + holidays + leave).
// Pure logic, ctx-first. Wire HTTP in apps/api, never here.
export * from './attendance';
export * from './tz'; // pickTimezone, effectiveTimezone (location-aware, plan 23)
