import { and, eq } from 'drizzle-orm'
import { db, schema } from '@avkash/db'
import { currentYear, ledgerBalance, yearEnd, yearStart } from './ledger'
import { proratedEntitlement } from './proration'
import { writeAudit } from './audit'

function expiryDate(mmdd: string | null, year: number): string | null {
  if (!mmdd) return null
  const m = /^(\d{2})\/(\d{2})$/.exec(mmdd)
  return m ? `${year}-${m[1]}-${m[2]}` : null
}

// Carry unused balance from (year-1) into `year`, capped at rollOverLimit, expiring
// on the policy's rollOverExpiry (MM/DD). Idempotent per (user, type, "rollover:year").
// Expired carry is excluded automatically by the balance query — no separate sweep.
export async function runRollover(year?: number): Promise<{ carried: number }> {
  const y = year ?? currentYear()
  const prior = y - 1
  const policies = await db
    .select({ policy: schema.leavePolicy, orgId: schema.leaveType.orgId })
    .from(schema.leavePolicy)
    .innerJoin(schema.leaveType, eq(schema.leavePolicy.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(and(eq(schema.leavePolicy.rollOver, true), eq(schema.leavePolicy.isActive, true)))

  const periodKey = `rollover:${y}`
  let carried = 0
  const byOrg: Record<string, number> = {}
  for (const { policy, orgId } of policies) {
    if (policy.unlimited) continue
    const max = Number(policy.maxLeaves ?? 0)
    const expiresOn = expiryDate(policy.rollOverExpiry, y)
    const members = await db
      .select({ id: schema.user.id, joinedOn: schema.user.joinedOn, createdAt: schema.user.createdAt })
      .from(schema.user)
      .where(eq(schema.user.teamId, policy.teamId))
    for (const m of members) {
      // Prior-year entitlement (prorated for that member's join year), so rollover
      // carries the right unused amount even for a mid-year joiner.
      const joinedOn = m.joinedOn ?? (m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : `${prior}-01-01`)
      const base = policy.accruals ? 0 : policy.prorateOnJoin ? proratedEntitlement(max, joinedOn, prior) : max
      const priorLedger = await ledgerBalance(orgId, m.id, policy.leaveTypeId, yearStart(prior), yearEnd(prior))
      const unused = base + priorLedger
      if (unused <= 0) continue
      const amount = Math.min(unused, policy.rollOverLimit ?? unused)
      if (amount <= 0) continue
      const res = await db
        .insert(schema.leaveLedger)
        .values({
          orgId,
          userId: m.id,
          leaveTypeId: policy.leaveTypeId,
          kind: 'ROLLOVER',
          amount: String(amount),
          effectiveOn: yearStart(y),
          expiresOn,
          periodKey,
          note: `carried from ${prior}`,
          createdBy: 'system',
        })
        .onConflictDoNothing({
          target: [schema.leaveLedger.userId, schema.leaveLedger.leaveTypeId, schema.leaveLedger.periodKey],
        })
        .returning({ id: schema.leaveLedger.id })
      carried += res.length
      if (res.length) byOrg[orgId] = (byOrg[orgId] ?? 0) + res.length
    }
  }
  for (const [auditOrgId, count] of Object.entries(byOrg)) {
    await writeAudit({
      orgId: auditOrgId,
      tableName: 'LeaveLedger',
      keyword: 'leave_rollover',
      changed: { year: y, carried: count },
      changedBy: 'system',
    })
  }
  return { carried }
}
