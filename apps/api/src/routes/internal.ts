import { Hono } from 'hono'
import { restrictExpiredOrgs } from '@avkash/org'

// Cron-triggered maintenance. MUST be protected (cron token / network policy) in
// production — open here for dev. A scheduler hits this on an interval.
export const internal = new Hono().post('/grace-sweep', async (c) => {
  const restricted = await restrictExpiredOrgs()
  return c.json({ restricted })
})
