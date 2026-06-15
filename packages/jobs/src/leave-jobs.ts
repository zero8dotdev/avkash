import { runAccrualCycle, runRollover } from '@avkash/leave';

// Scheduled leave maintenance, callable directly (the worker schedules these; the
// /internal routes trigger them manually). All idempotent, so re-runs are safe.
//
// accrualTick runs the DAILY cycle — each policy decides if today is its credit day
// (frequency × accrueOn), credits the ledger, then notifies whoever was credited.
export const leaveJobs = {
  accrualTick: (date?: Date) => runAccrualCycle(date),
  rollover: (year?: number) => runRollover(year),
};
