import { Hono } from 'hono'
import { earnCompOff, approveCompOff, rejectCompOff, listCompOff, type EarnCompOffInput } from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const compOff = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as EarnCompOffInput
    return c.json(await earnCompOff(c.get('auth'), body), 201)
  })
  .get('/', async (c) => c.json(await listCompOff(c.get('auth'), c.req.query('userId'))))
  .post('/:id/approve', async (c) => c.json(await approveCompOff(c.get('auth'), c.req.param('id'))))
  .post('/:id/reject', async (c) => c.json(await rejectCompOff(c.get('auth'), c.req.param('id'))))
