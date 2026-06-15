import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { currentYear, ledgerBalance, yearEnd, yearStart } from './ledger';
import { proratedEntitlement } from './proration';
import { writeAudit } from './audit';

function expiryDate(mmdd: string | null, year: number): string | null {
  if (!mmdd) return null;
  const m = /^(\d{2})\/(\d{2})$/.exec(mmdd);
  return m ? `${year}-${m[1]}-${m[2]}` : null;
}

// Carry unused balance from (year-1) into `year`, capped at rollOverLimit, expiring
// on the policy's rollOverExpiry (MM/DD). Idempotent per (user, type, "rollover:year").
// Expired carry is excluded automatically by the balance query — no separate sweep.
export async function runRollover(year?: number): Promise<{ carried: number }> {
  const y = year ?? currentYear();
  const prior = y - 1;
  const policies = await db
    .select({ policy: schema.leavePolicy, orgId: schema.leaveType.orgId })
    .from(schema.leavePolicy)
    .innerJoin(schema.leaveType, eq(schema.leavePolicy.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(and(eq(schema.leavePolicy.rollOver, true), eq(schema.leavePolicy.isActive, true)));

  const periodKey = `rollover:${y}`;

  // Carry one member's unused prior-year balance. Returns the orgId on a successful
  // (non-duplicate) insert, or null when there's nothing to carry / already carried.
  const carryMember = async (
    policy: (typeof policies)[number]['policy'],
    orgId: string,
    m: { id: string; joinedOn: string | null; createdAt: Date | null }
  ): Promise<string | null> => {
    const max = Number(policy.maxLeaves ?? 0);
    // Prior-year entitlement (prorated for that member's join year), so rollover
    // carries the right unused amount even for a mid-year joiner.
    const joinedOn = m.joinedOn ?? (m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : `${prior}-01-01`);
    const base = policy.accruals ? 0 : policy.prorateOnJoin ? proratedEntitlement(max, joinedOn, prior) : max;
    const priorLedger = await ledgerBalance(orgId, m.id, policy.leaveTypeId, yearStart(prior), yearEnd(prior));
    const unused = base + priorLedger;
    if (unused <= 0) return null;
    const amount = Math.min(unused, policy.rollOverLimit ?? unused);
    if (amount <= 0) return null;
    const res = await db
      .insert(schema.leaveLedger)
      .values({
        orgId,
        userId: m.id,
        leaveTypeId: policy.leaveTypeId,
        kind: 'ROLLOVER',
        amount: String(amount),
        effectiveOn: yearStart(y),
        expiresOn: expiryDate(policy.rollOverExpiry, y),
        periodKey,
        note: `carried from ${prior}`,
        createdBy: 'system',
      })
      .onConflictDoNothing({
        target: [schema.leaveLedger.userId, schema.leaveLedger.leaveTypeId, schema.leaveLedger.periodKey],
      })
      .returning({ id: schema.leaveLedger.id });
    return res.length ? orgId : null;
  };

  // Fan out across policies, then members — members are independent, so no need to
  // serialise the DB round-trips (which also keeps us clear of no-await-in-loop).
  const outcomes = await Promise.all(
    policies
      .filter(({ policy }) => !policy.unlimited)
      .map(async ({ policy, orgId }) => {
        const members = await db
          .select({
            id: schema.user.id,
            joinedOn: schema.user.joinedOn,
            createdAt: schema.user.createdAt,
          })
          .from(schema.user)
          .where(eq(schema.user.teamId, policy.teamId));
        return Promise.all(members.map((m) => carryMember(policy, orgId, m)));
      })
  );

  const byOrg: Record<string, number> = {};
  for (const orgId of outcomes.flat()) {
    if (orgId) byOrg[orgId] = (byOrg[orgId] ?? 0) + 1;
  }
  await Promise.all(
    Object.entries(byOrg).map(([auditOrgId, count]) =>
      writeAudit({
        orgId: auditOrgId,
        tableName: 'LeaveLedger',
        keyword: 'leave_rollover',
        changed: { year: y, carried: count },
        changedBy: 'system',
      })
    )
  );
  return { carried: Object.values(byOrg).reduce((a, b) => a + b, 0) };
}
