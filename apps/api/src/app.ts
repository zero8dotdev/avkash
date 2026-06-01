import { Hono } from 'hono'
import { auth } from '@avkash/auth'
import { DomainError } from '@avkash/shared'
import { leaves } from './routes/leave'
import { orgs } from './routes/orgs'
import { invitations } from './routes/invitations'
import { internal } from './routes/internal'

// The wiring layer. Each route group is thin: parse request -> call a domain
// function with ctx -> return json. The exported AppType is the type-safe
// contract the web client consumes (no codegen).
export const app = new Hono()
  .get('/health', (c) => c.json({ ok: true, service: 'api' }))
  // Better Auth owns /api/auth/* (sign-in, sign-up, OAuth callbacks, OTP, …).
  .on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .route('/orgs', orgs)
  .route('/invitations', invitations)
  .route('/leaves', leaves)
  .route('/internal', internal)
  // Map typed domain errors to HTTP status; everything else is a 500.
  .onError((err, c) => {
    if (err instanceof DomainError) {
      const status =
        err.code === 'FORBIDDEN' ? 403 : err.code === 'NOT_FOUND' ? 404 : err.code === 'UNAUTHENTICATED' ? 401 : 400
      return c.json({ error: err.message, code: err.code }, status)
    }
    console.error(err)
    return c.json({ error: 'internal error' }, 500)
  })
export type AppType = typeof app
