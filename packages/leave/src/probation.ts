import { and, eq, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { todayStr } from './ledger';
import { writeAudit } from './audit';

export interface ProbationCompletionResult {
  date: string;
  transitioned: number;
  userIds: string[];
}

// Daily cron job: graduates employees whose probationEndsOn has passed.
// Transitions PROBATION → ACTIVE and clears probationEndsOn so the overlay
// no longer applies on the next balance/accrual read.
// Idempotent — already-ACTIVE employees are skipped by the WHERE clause.
export async function runProbationCompletion(now: Date = new Date()): Promise<ProbationCompletionResult> {
  const today = todayStr(now);
  const rows = await db
    .update(schema.employeeProfile)
    .set({ employmentStatus: 'ACTIVE', confirmedOn: today, updatedOn: new Date(), updatedBy: 'system' })
    .where(
      and(
        eq(schema.employeeProfile.employmentStatus, 'PROBATION'),
        lte(schema.employeeProfile.probationEndsOn, today)
      )
    )
    .returning({ userId: schema.employeeProfile.userId, orgId: schema.employeeProfile.orgId });

  if (rows.length) {
    const byOrg = rows.reduce<Record<string, string[]>>((acc, r) => {
      (acc[r.orgId] ??= []).push(r.userId);
      return acc;
    }, {});
    await Promise.all(
      Object.entries(byOrg).map(([orgId, userIds]) =>
        writeAudit({
          orgId,
          tableName: 'EmployeeProfile',
          keyword: 'probation_completion',
          changed: { date: today, count: userIds.length, userIds },
          changedBy: 'system',
        })
      )
    );
  }

  return { date: today, transitioned: rows.length, userIds: rows.map((r) => r.userId) };
}
