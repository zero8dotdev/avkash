import { createMiddleware } from 'hono/factory'
import { type AuthContext, UnauthenticatedError } from '@avkash/shared'
import { getAuthContext } from '@avkash/auth'

// Typed Hono env so handlers can read c.get('auth') as an AuthContext.
export type AppEnv = { Variables: { auth: AuthContext } }

// Resolve the session → ctx at the edge. No session → throw, so onError emits the
// single error envelope (instead of a one-off shape here).
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const ctx = await getAuthContext(c.req.raw.headers)
  if (!ctx) throw new UnauthenticatedError()
  c.set('auth', ctx)
  await next()
})
