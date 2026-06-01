import { Hono } from 'hono'
import { listLeaves } from '@avkash/leave'
// import { authMiddleware } from '../middleware/auth'

// Thin transport adapter for HTTP. Logic lives in @avkash/leave, not here.
export const leaves = new Hono().get('/', async (c) => {
  // const ctx = c.get('auth')                 // set by auth middleware
  // return c.json(await listLeaves(ctx, parseFilter(c.req.query())))
  void listLeaves
  return c.json({ ok: true, todo: 'wire auth middleware + ctx' })
})
