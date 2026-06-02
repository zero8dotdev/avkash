import { Hono } from 'hono'
import { createLeavePolicy, updateLeavePolicy, type CreateLeavePolicyInput } from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const leavePolicies = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as CreateLeavePolicyInput
    return c.json(await createLeavePolicy(c.get('auth'), body), 201)
  })
  .patch('/:id', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Partial<CreateLeavePolicyInput> & { isActive?: boolean }
    return c.json(await updateLeavePolicy(c.get('auth'), c.req.param('id'), body))
  })
