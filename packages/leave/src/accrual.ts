import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { currentYear, todayStr } from './ledger';
import { writeAudit } from './audit';
import { accrualOccursOn, nextAccrualOn, periodKeyFor } from './accrual-schedule';
import { effectiveAccrualRate, probationAccrualsEnabled, type EmploymentStatus } from './probation-pure';

// One credited ledger row, surfaced so the caller (the notification
// dispatcher) knows exactly who to tell and how much landed.
export interface AccrualCredit {
  orgId: string;
  userId: string;
  leaveTypeId: string;
  amount: number;
  periodKey: string;
}

export interface AccrualTickResult {
  date: string; // YYYY-MM-DD
  posted: number;
  credits: AccrualCredit[];
}

// Daily accrual tick (platform job, no ctx — runs across every org). Credits each
// active accrual policy whose cadence lands on `now` (accrual-schedule decides).
// Each post is idempotent per (user, type, periodKey) via the ledger's unique
// index, so re-running a day — or resuming a half-failed run — never double-credits.
export async function runAccrualTick(now: Date = new Date()): Promise<AccrualTickResult> {
  const policies = await db
    .select({ policy: schema.leavePolicy, orgId: schema.leaveType.orgId })
    .from(schema.leavePolicy)
    .innerJoin(schema.leaveType, eq(schema.leavePolicy.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(and(eq(schema.leavePolicy.accruals, true), eq(schema.leavePolicy.isActive, true)));

  const due = policies.filter(({ policy }) => accrualOccursOn(policy, now));

  const perPolicy = await Promise.all(
    due.map(async ({ policy, orgId }): Promise<AccrualCredit[]> => {
      if (policy.unlimited || !policy.maxLeaves || !policy.accrualFrequency) return [];
      const amount = policy.accrualFrequency === 'MONTHLY' ? policy.maxLeaves / 12 : policy.maxLeaves / 4;
      const periodKey = periodKeyFor(policy.accrualFrequency, now);
      // Fetch member status to apply probation overlay per-member.
      const members = await db
        .select({ id: schema.user.id, employmentStatus: schema.employeeProfile.employmentStatus })
        .from(schema.user)
        .leftJoin(schema.employeeProfile, eq(schema.employeeProfile.userId, schema.user.id))
        .where(eq(schema.user.teamId, policy.teamId));
      if (!members.length) return [];
      // Build per-member ledger rows — probationers may have a different rate or no accrual.
      const rows = members.flatMap((m) => {
        const status = (m.employmentStatus ?? 'ACTIVE') as EmploymentStatus;
        if (!probationAccrualsEnabled(policy, status)) return [];
        const effectiveRateStr = effectiveAccrualRate(String(amount), policy, status);
        const effectiveAmount = effectiveRateStr ? Number(effectiveRateStr) : amount;
        return [{
          orgId,
          userId: m.id,
          leaveTypeId: policy.leaveTypeId,
          kind: 'ACCRUAL' as const,
          amount: String(effectiveAmount),
          effectiveOn: todayStr(now),
          periodKey,
          note: `${policy.accrualFrequency!.toLowerCase()} accrual`,
          createdBy: 'system',
        }];
      });
      if (!rows.length) return [];
      // onConflictDoNothing: re-running a day never double-credits.
      const inserted = await db
        .insert(schema.leaveLedger)
        .values(rows)
        .onConflictDoNothing({
          target: [schema.leaveLedger.userId, schema.leaveLedger.leaveTypeId, schema.leaveLedger.periodKey],
        })
        .returning({ userId: schema.leaveLedger.userId, amount: schema.leaveLedger.amount });
      return inserted.map((r) => ({
        orgId,
        userId: r.userId,
        leaveTypeId: policy.leaveTypeId,
        amount: Number(r.amount),
        periodKey,
      }));
    })
  );

  const credits = perPolicy.flat();
  const byOrg = credits.reduce<Record<string, number>>(
    (acc, c) => ({ ...acc, [c.orgId]: (acc[c.orgId] ?? 0) + 1 }),
    {}
  );
  await Promise.all(
    Object.entries(byOrg).map(([auditOrgId, count]) =>
      writeAudit({
        orgId: auditOrgId,
        tableName: 'LeaveLedger',
        keyword: 'leave_accrual',
        changed: { date: todayStr(now), posted: count },
        changedBy: 'system',
      })
    )
  );
  return { date: todayStr(now), posted: credits.length, credits };
}

// HR/Admin view: every active accrual policy in the org with its next credit date,
// per-member amount, and headcount it credits. Powers the dashboard's "next leave
// balance credit", computed with the same nextAccrualOn the tick uses.
export interface UpcomingAccrual {
  leavePolicyId: string;
  leaveTypeId: string;
  teamId: string;
  frequency: 'MONTHLY' | 'QUARTERLY';
  accrueOn: 'BEGINNING' | 'END';
  nextCreditOn: string | null;
  amountPerMember: number;
  members: number;
}

export async function upcomingAccruals(ctx: AuthContext, from: Date = new Date()): Promise<UpcomingAccrual[]> {
  requireRole(ctx, 'ADMIN');
  const rows = await db
    .select({ policy: schema.leavePolicy, members: sql<number>`count(${schema.user.id})::int` })
    .from(schema.leavePolicy)
    .innerJoin(schema.leaveType, eq(schema.leavePolicy.leaveTypeId, schema.leaveType.leaveTypeId))
    .leftJoin(schema.user, eq(schema.user.teamId, schema.leavePolicy.teamId))
    .where(
      and(
        eq(schema.leaveType.orgId, ctx.orgId),
        eq(schema.leavePolicy.accruals, true),
        eq(schema.leavePolicy.isActive, true)
      )
    )
    .groupBy(schema.leavePolicy.leavePolicyId);

  return rows
    .filter((r) => r.policy.accrualFrequency && !r.policy.unlimited && r.policy.maxLeaves)
    .map((r) => {
      const frequency = r.policy.accrualFrequency!;
      const next = nextAccrualOn(r.policy, from);
      return {
        leavePolicyId: r.policy.leavePolicyId,
        leaveTypeId: r.policy.leaveTypeId,
        teamId: r.policy.teamId,
        frequency,
        accrueOn: r.policy.accrueOn ?? 'BEGINNING',
        nextCreditOn: next ? next.toISOString().slice(0, 10) : null,
        amountPerMember: frequency === 'MONTHLY' ? r.policy.maxLeaves! / 12 : r.policy.maxLeaves! / 4,
        members: r.members,
      };
    })
    .sort((a, b) => (a.nextCreditOn ?? '').localeCompare(b.nextCreditOn ?? ''));
}

export { currentYear };
