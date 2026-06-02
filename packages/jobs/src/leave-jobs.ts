import { runAccruals, runRollover } from '@avkash/leave';

// Scheduled leave maintenance. In production a BullMQ repeatable job (Redis) or an
// external scheduler invokes these; today they're triggered via POST /internal/leave-*.
// All are idempotent, so re-runs are safe.
export const leaveJobs = {
  monthlyAccrual: () => runAccruals('MONTHLY'),
  quarterlyAccrual: () => runAccruals('QUARTERLY'),
  rollover: (year?: number) => runRollover(year),
};
