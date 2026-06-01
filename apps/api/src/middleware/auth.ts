import { createMiddleware } from 'hono/factory'
import type { AuthContext } from '@avkash/shared'
import { getAuthContext } from '@avkash/auth'

// Typed Hono env so handlers can read c.get('auth') as an AuthContext.
export type AppEnv = { Variables: { auth: AuthContext } }

// Resolve the session → ctx at the edge, or 401. Domain functions take the ctx.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const ctx = await getAuthContext(c.req.raw.headers)
  if (!ctx) return c.json({ error: 'unauthenticated' }, 401)
  c.set('auth', ctx)
  await next()
})
