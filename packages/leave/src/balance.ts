import { eq } from 'drizzle-orm'
import { db, schema } from '@avkash/db'
import type { AuthContext } from '@avkash/shared'
import { currentYear, ledgerBalance, plannedDays, takenDays, todayStr, yearEnd, yearStart } from './ledger'
import { getEffectivePolicy } from './leave-policy'
import { listLeaveTypes } from './leave-type'

export interface LeaveBalance {
  leaveTypeId: string
  year: number
  entitlement: number | 'UNLIMITED'
  balance: number | 'UNLIMITED'
  available: number | 'UNLIMITED'
  taken: number
  planned: number
}

async function userTeam(userId: string): Promise<string | null> {
  const [u] = await db.select({ teamId: schema.user.teamId }).from(schema.user).where(eq(schema.user.id, userId)).limit(1)
  return u?.teamId ?? null
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
  const teamId = await userTeam(userId)
  const policy = teamId ? await getEffectivePolicy(ctx.orgId, teamId, leaveTypeId) : null
  const from = yearStart(year)
  const windowEnd = year === currentYear() ? todayStr() : yearEnd(year)
  const taken = await takenDays(ctx.orgId, userId, leaveTypeId, from, yearEnd(year))
  const planned = await plannedDays(ctx.orgId, userId, leaveTypeId, from, yearEnd(year))
  if (policy?.unlimited) {
    return { leaveTypeId, year, entitlement: 'UNLIMITED', balance: 'UNLIMITED', available: 'UNLIMITED', taken, planned }
  }
  const base = policy && !policy.accruals ? Number(policy.maxLeaves ?? 0) : 0
  const ledger = await ledgerBalance(ctx.orgId, userId, leaveTypeId, from, windowEnd)
  const balance = base + ledger // ledger holds TAKEN (−) and ACCRUAL/ROLLOVER (+)
  return { leaveTypeId, year, entitlement: base, balance, available: balance - planned, taken, planned }
}

export async function getBalances(ctx: AuthContext, userId: string, year?: number): Promise<LeaveBalance[]> {
  const types = await listLeaveTypes(ctx, { activeOnly: true })
  return Promise.all(types.map((t) => getBalance(ctx, userId, t.leaveTypeId, year)))
}
