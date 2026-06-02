import { eq } from 'drizzle-orm'
import { db, schema } from '@avkash/db'
import type { AuthContext } from '@avkash/shared'
import { currentYear, ledgerBalance, plannedDays, takenDays, todayStr, yearEnd, yearStart } from './ledger'
import { getEffectivePolicy } from './leave-policy'
import { listLeaveTypes } from './leave-type'
import { proratedEntitlement } from './proration'

export interface LeaveBalance {
  leaveTypeId: string
  year: number
  entitlement: number | 'UNLIMITED'
  balance: number | 'UNLIMITED'
  available: number | 'UNLIMITED'
  taken: number
  planned: number
}

async function userInfo(userId: string): Promise<{ teamId: string | null; joinedOn: string }> {
  const [u] = await db
    .select({ teamId: schema.user.teamId, joinedOn: schema.user.joinedOn, createdAt: schema.user.createdAt })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1)
  // Effective join date: explicit joinedOn, else account-creation date, else today.
  const joinedOn = u?.joinedOn ?? (u?.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : todayStr())
  return { teamId: u?.teamId ?? null, joinedOn }
}

// Balance is scoped to a leave YEAR (calendar). entitlement = maxLeaves (implicit,
// per year) for non-accrual policies, or 0 for accrual (built from ACCRUAL ledger
// credits). The ledger sum is windowed to [Jan 1, today] of the year, so last
// year's debits naturally fall away and the entitlement "resets" each January.
export async function getBalance(
  ctx: AuthContext,
  userId: string,
  leaveTypeId: string,
  year: number = currentYear(),
): Promise<LeaveBalance> {
  const { teamId, joinedOn } = await userInfo(userId)
  const policy = teamId ? await getEffectivePolicy(ctx.orgId, teamId, leaveTypeId) : null
  const from = yearStart(year)
  const windowEnd = year === currentYear() ? todayStr() : yearEnd(year)
  const taken = await takenDays(ctx.orgId, userId, leaveTypeId, from, yearEnd(year))
  const planned = await plannedDays(ctx.orgId, userId, leaveTypeId, from, yearEnd(year))
  if (policy?.unlimited) {
    return { leaveTypeId, year, entitlement: 'UNLIMITED', balance: 'UNLIMITED', available: 'UNLIMITED', taken, planned }
  }
  // Non-accrual base entitlement, prorated for the join year when the policy says so.
  let base = 0
  if (policy && !policy.accruals) {
    const max = Number(policy.maxLeaves ?? 0)
    base = policy.prorateOnJoin ? proratedEntitlement(max, joinedOn, year) : max
  }
  const ledger = await ledgerBalance(ctx.orgId, userId, leaveTypeId, from, windowEnd)
  const balance = base + ledger // ledger holds TAKEN (−) and ACCRUAL/ROLLOVER (+)
  return { leaveTypeId, year, entitlement: base, balance, available: balance - planned, taken, planned }
}

export async function getBalances(ctx: AuthContext, userId: string, year?: number): Promise<LeaveBalance[]> {
  const types = await listLeaveTypes(ctx, { activeOnly: true })
  return Promise.all(types.map((t) => getBalance(ctx, userId, t.leaveTypeId, year)))
}
