import { Hono } from 'hono'
import {
  requestEncashment,
  approveEncashment,
  markEncashmentPaid,
  rejectEncashment,
  type RequestEncashmentInput,
} from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const encashments = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as RequestEncashmentInput
    return c.json(await requestEncashment(c.get('auth'), body), 201)
  })
  .post('/:id/approve', async (c) => c.json(await approveEncashment(c.get('auth'), c.req.param('id'))))
  .post('/:id/pay', async (c) => c.json(await markEncashmentPaid(c.get('auth'), c.req.param('id'))))
  .post('/:id/reject', async (c) => c.json(await rejectEncashment(c.get('auth'), c.req.param('id'))))
