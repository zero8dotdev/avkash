import { Hono } from 'hono'
import { balanceSummary, utilization } from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const reports = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/leave-balance', async (c) => c.json(await balanceSummary(c.get('auth'), { teamId: c.req.query('teamId') })))
  .get('/leave-utilization', async (c) => {
    const yr = c.req.query('year')
    return c.json(await utilization(c.get('auth'), { teamId: c.req.query('teamId'), year: yr ? Number(yr) : undefined }))
  })
