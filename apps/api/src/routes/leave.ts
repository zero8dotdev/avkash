import { Hono } from 'hono'
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  listLeaves,
  getLeave,
  type ApplyLeaveInput,
  type ListLeavesFilter,
} from '@avkash/leave'
import { type AppEnv, requireAuth } from '../middleware/auth'

// Thin transport adapter. Logic + authz live in @avkash/leave; this just maps HTTP.
export const leaves = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as ApplyLeaveInput
    return c.json(await applyLeave(c.get('auth'), body), 201)
  })
  .get('/', async (c) => {
    const filter: ListLeavesFilter = {
      status: c.req.query('status') as ListLeavesFilter['status'],
      userId: c.req.query('userId'),
    }
    return c.json(await listLeaves(c.get('auth'), filter))
  })
  .get('/:id', async (c) => c.json(await getLeave(c.get('auth'), c.req.param('id'))))
  .post('/:id/approve', async (c) => {
    const { comment } = (await c.req.json().catch(() => ({}))) as { comment?: string }
    return c.json(await approveLeave(c.get('auth'), c.req.param('id'), comment))
  })
  .post('/:id/reject', async (c) => {
    const { comment } = (await c.req.json().catch(() => ({}))) as { comment?: string }
    return c.json(await rejectLeave(c.get('auth'), c.req.param('id'), comment))
  })
  .delete('/:id', async (c) => {
    await cancelLeave(c.get('auth'), c.req.param('id'))
    return c.json({ cancelled: true })
  })
