import { runAccrualCycle, runEscalations, runRollover } from '@avkash/leave';
import { restrictExpiredOrgs } from '@avkash/org';
import { materializeHolidays } from '@avkash/holidays';

export interface ScheduledJob {
  name: string;
  cron: string; // crontab, UTC
  run: () => Promise<unknown>;
}

// All recurring maintenance in one place. Times are UTC. Every run() is idempotent
// (ledger / outbox / status guards), so a missed tick or a double fire is always
// safe — add a job here and the worker picks it up.
export const SCHEDULE: ScheduledJob[] = [
  { name: 'accrual-tick', cron: '0 1 * * *', run: () => runAccrualCycle() }, // daily 01:00 — credit + notify
  { name: 'escalations', cron: '0 * * * *', run: () => runEscalations() }, // hourly — PENDING past SLA → HR
  { name: 'grace-sweep', cron: '30 1 * * *', run: () => restrictExpiredOrgs() }, // daily 01:30 — expire grace orgs
  { name: 'leave-rollover', cron: '0 2 1 1 *', run: () => runRollover() }, // Jan 1 02:00 — year-end rollover
  {
    name: 'holiday-materialize',
    cron: '0 3 1 12 *', // Dec 1 03:00 — roll movable holidays into next year
    run: () => materializeHolidays(new Date().getUTCFullYear() + 1),
  },
];
