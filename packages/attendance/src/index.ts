// attendance domain — punches + the daily resolver (workweek + holidays + leave).
// Pure logic, ctx-first. Wire HTTP in apps/api, never here.
export * from './attendance';
export * from './tz'; // pickTimezone, effectiveTimezone (location-aware)
export * from './window'; // inWindow, localTimeHHMM (pure, tested)
export * from './device'; // device CRUD + enrollment + ingestPunch + DeviceContext + sha256
export * from './shift'; // shift CRUD + roster + shiftForDate
export * from './shift-marks'; // pure: pairSessions, computeMarks (tested)
export * from './regularization'; // request/approve/reject attendance fixes
export * from './summary'; // pure: summarize → AttendanceSummary (tested, no DB)
export * from './muster'; // muster report (read-only rollups)
export * from './source-policy'; // per-level attendance source enforcement
export * from './workweek-pattern'; // rotating workweek patterns (alternate Saturdays)
export * from './workweek-pure'; // effectiveWorkdays, isWorkday, countWorkdays (pure, tested)
export * from './confirmation'; // confirmPunches, listPendingConfirmations
export * from './supervisor';   // shift supervisor assignment + guards
