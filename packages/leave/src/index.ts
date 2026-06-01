import type { AuthContext } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
// import { db, schema } from '@avkash/db'

// Pure business logic — NO HTTP here. Every function takes ctx first; org
// scoping (the RLS replacement) and role checks live in this layer, not the route.
export interface LeaveFilter { status?: string }

export async function listLeaves(_ctx: AuthContext, _filter: LeaveFilter) {
  // return db.select().from(schema.leave).where(eq(schema.leave.orgId, _ctx.orgId))
  throw new Error('not implemented')
}

export async function approveLeave(ctx: AuthContext, _leaveId: string) {
  requireRole(ctx, 'MANAGER')
  // ... org-scoped update
  throw new Error('not implemented')
}
