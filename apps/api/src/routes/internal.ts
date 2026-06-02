import { Hono } from 'hono'
import { restrictExpiredOrgs } from '@avkash/org'
import { runAccruals, runRollover } from '@avkash/leave'

// Cron-triggered maintenance. MUST be protected (cron token / network policy) in
// production — open here for dev. A scheduler hits these on a schedule; all are
// idempotent so re-runs are safe.
export const internal = new Hono()
  .post('/grace-sweep', async (c) => c.json({ restricted: await restrictExpiredOrgs() }))
  .post('/leave-accrual', async (c) => {
    const freq = c.req.query('frequency') === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY'
    return c.json(await runAccruals(freq))
  })
  .post('/leave-rollover', async (c) => {
    const yr = c.req.query('year')
    return c.json(await runRollover(yr ? Number(yr) : undefined))
  })
