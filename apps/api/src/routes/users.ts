import { Hono } from 'hono'
import { setUserWorkweek } from '@avkash/users'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const users = new Hono<AppEnv>().use(requireAuth).patch('/:id/workweek', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { workweek?: string[] }
  return c.json(await setUserWorkweek(c.get('auth'), c.req.param('id'), body.workweek ?? []))
})
