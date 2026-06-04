import { Hono } from 'hono';
import { restrictExpiredOrgs } from '@avkash/org';
import { runAccrualCycle, runRollover, runEscalations } from '@avkash/leave';
import { materializeHolidays } from '@avkash/holidays';
import { requireInternalToken } from '../middleware/internal-auth';

// Cron-triggered maintenance. Protected by a cron token (X-Internal-Token via
// requireInternalToken). A scheduler hits these on a schedule; all are idempotent
// so re-runs are safe.
export const internal = new Hono()
  .use(requireInternalToken)
  .post('/grace-sweep', async (c) => c.json({ restricted: await restrictExpiredOrgs() }))
  // Daily accrual tick — each policy decides if today is its credit day. `?date=`
  // (YYYY-MM-DD) overrides "today" for testing/backfill. Idempotent per period.
  // Daily accrual cycle (credit + notify). `?date=` (YYYY-MM-DD) overrides "today"
  // for testing/backfill. Idempotent per period — the worker runs the same cycle.
  .post('/accrual-tick', async (c) => {
    const date = c.req.query('date');
    return c.json(await runAccrualCycle(date ? new Date(`${date}T00:00:00Z`) : undefined));
  })
  .post('/leave-rollover', async (c) => {
    const yr = c.req.query('year');
    return c.json(await runRollover(yr ? Number(yr) : undefined));
  })
  // Roll movable holidays forward into the target year (default: next year).
  .post('/holiday-materialize', async (c) => {
    const yr = c.req.query('year');
    return c.json(await materializeHolidays(yr ? Number(yr) : new Date().getFullYear() + 1));
  })
  // Escalate PENDING leaves past their SLA to HR.
  .post('/escalations', async (c) => c.json(await runEscalations()));
