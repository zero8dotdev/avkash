import { runAccrualTick, runRollover } from '@avkash/leave';

// Scheduled leave maintenance. In production a BullMQ repeatable job (Redis) or an
// external scheduler invokes these; today they're triggered via POST /internal/*.
// All are idempotent, so re-runs are safe.
//
// accrualTick runs DAILY — each policy decides (by its frequency × accrueOn) whether
// today is its credit day, so one cron covers monthly/quarterly × start/end cadence.
export const leaveJobs = {
  accrualTick: (date?: Date) => runAccrualTick(date),
  rollover: (year?: number) => runRollover(year),
};
