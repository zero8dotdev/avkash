import { eq } from 'drizzle-orm'
import { db, schema, type User } from '@avkash/db'
import type { AuthContext, Role, Transport, Assurance } from '@avkash/shared'
import { auth } from './auth'

// ── The funnel ───────────────────────────────────────────────────────────────
// Every authN path ends here — the ONLY place that stamps assurance / actorType /
// via onto a context, so the rest of the system is uniform. Adding a transport =
// adding a resolver that calls this — zero authz changes downstream.
function toAuthContext(u: User, opts: { assurance: Assurance; via: Transport }): AuthContext {
  return {
    orgId: u.orgId ?? '',
    userId: u.id,
    role: u.role as Role,
    actorType: 'user',
    assurance: opts.assurance,
    via: opts.via,
  }
}

// ── AuthN resolver (HTTP) ─────────────────────────────────────────────────────
/**
 * Cookie / bearer session → ctx. Default assurance is 'medium' so high-assurance
 * actions fail-closed (step up). Per-method assurance (Google = high) is a
 * refinement that reads the account provider used for this session.
 */
export async function getAuthContext(headers: Headers): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers })
  if (!session?.user) return null
  const [u] = await db.select().from(schema.user).where(eq(schema.user.id, session.user.id)).limit(1)
  return u ? toAuthContext(u, { assurance: 'medium', via: 'http' }) : null
}
