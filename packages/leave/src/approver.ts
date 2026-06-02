import { eq } from 'drizzle-orm'
import { db, schema } from '@avkash/db'
import type { AuthContext } from '@avkash/shared'
import { isActiveDelegate } from './delegation'

// Can ctx approve leaves for this team? OWNER/ADMIN anywhere, a team manager, or
// an active delegate. Shared by approval-gating AND comment visibility.
export async function canApprove(ctx: AuthContext, teamId: string): Promise<boolean> {
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return true
  const [t] = await db.select({ managers: schema.team.managers }).from(schema.team).where(eq(schema.team.teamId, teamId)).limit(1)
  if (t && (t.managers ?? []).includes(ctx.userId ?? '')) return true
  return isActiveDelegate(ctx.orgId, ctx.userId ?? '', teamId)
}
