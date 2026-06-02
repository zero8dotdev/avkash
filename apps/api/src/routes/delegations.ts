import { Hono } from 'hono'
import { setDelegation, clearDelegation, listDelegations, type SetDelegationInput } from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const delegations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as SetDelegationInput
    return c.json(await setDelegation(c.get('auth'), body), 201)
  })
  .get('/', async (c) => c.json(await listDelegations(c.get('auth'))))
  .delete('/:id', async (c) => {
    await clearDelegation(c.get('auth'), c.req.param('id'))
    return c.json({ cleared: true })
  })
