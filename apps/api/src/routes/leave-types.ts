import { Hono } from 'hono'
import { createLeaveType, listLeaveTypes, updateLeaveType, type CreateLeaveTypeInput } from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

export const leaveTypes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => c.json(await listLeaveTypes(c.get('auth'), { activeOnly: c.req.query('active') === 'true' })))
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as CreateLeaveTypeInput
    return c.json(await createLeaveType(c.get('auth'), body), 201)
  })
  .patch('/:id', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Partial<CreateLeaveTypeInput> & { isActive?: boolean }
    return c.json(await updateLeaveType(c.get('auth'), c.req.param('id'), body))
  })
