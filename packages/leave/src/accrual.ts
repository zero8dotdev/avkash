import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { currentYear, todayStr } from './ledger';
import { writeAudit } from './audit';

type Frequency = 'MONTHLY' | 'QUARTERLY';

function periodLabel(freq: Frequency, now: Date): string {
  const y = now.getUTCFullYear();
  if (freq === 'MONTHLY') return `${y}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${y}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

// Platform job (no ctx — runs across all orgs). For every active accrual policy of
// this frequency, credit maxLeaves/12 (monthly) or /4 (quarterly) to each team
// member. Idempotent per (user, type, period) via onConflictDoNothing.
export async function runAccruals(freq: Frequency, now: Date = new Date()): Promise<{ posted: number }> {
  const periodKey = `accrual:${periodLabel(freq, now)}`;
  const policies = await db
    .select({ policy: schema.leavePolicy, orgId: schema.leaveType.orgId })
    .from(schema.leavePolicy)
    .innerJoin(schema.leaveType, eq(schema.leavePolicy.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(
      and(
        eq(schema.leavePolicy.accruals, true),
        eq(schema.leavePolicy.isActive, true),
        eq(schema.leavePolicy.accrualFrequency, freq)
      )
    );

  let posted = 0;
  const byOrg: Record<string, number> = {};
  for (const { policy, orgId } of policies) {
    if (policy.unlimited || !policy.maxLeaves) continue;
    const amount = freq === 'MONTHLY' ? policy.maxLeaves / 12 : policy.maxLeaves / 4;
    const members = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.teamId, policy.teamId));
    for (const m of members) {
      const res = await db
        .insert(schema.leaveLedger)
        .values({
          orgId,
          userId: m.id,
          leaveTypeId: policy.leaveTypeId,
          kind: 'ACCRUAL',
          amount: String(amount),
          effectiveOn: todayStr(now),
          periodKey,
          note: `${freq.toLowerCase()} accrual`,
          createdBy: 'system',
        })
        .onConflictDoNothing({
          target: [schema.leaveLedger.userId, schema.leaveLedger.leaveTypeId, schema.leaveLedger.periodKey],
        })
        .returning({ id: schema.leaveLedger.id });
      posted += res.length;
      if (res.length) byOrg[orgId] = (byOrg[orgId] ?? 0) + res.length;
    }
  }
  for (const [auditOrgId, count] of Object.entries(byOrg)) {
    await writeAudit({
      orgId: auditOrgId,
      tableName: 'LeaveLedger',
      keyword: 'leave_accrual',
      changed: { frequency: freq, periodKey, posted: count },
      changedBy: 'system',
    });
  }
  return { posted };
}

export { currentYear };
