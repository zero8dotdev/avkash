import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { getBalances, type LeaveBalance } from './balance';
import { currentYear, yearEnd, yearStart } from './ledger';

export interface UserBalanceReport {
  userId: string;
  name: string | null;
  balances: LeaveBalance[];
}

// Per-user balances across active leave types, for a team or the whole org.
export async function balanceSummary(ctx: AuthContext, opts?: { teamId?: string }): Promise<UserBalanceReport[]> {
  requireRole(ctx, 'MANAGER');
  const where = opts?.teamId
    ? and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.teamId, opts.teamId))
    : eq(schema.user.orgId, ctx.orgId);
  const users = await db.select({ id: schema.user.id, name: schema.user.name }).from(schema.user).where(where);
  return Promise.all(users.map(async (u) => ({ userId: u.id, name: u.name, balances: await getBalances(ctx, u.id) })));
}

export interface UtilizationRow {
  leaveTypeId: string;
  name: string;
  taken: number;
  planned: number;
}

// Taken vs planned days per leave type for a year, across a team or the org.
export async function utilization(
  ctx: AuthContext,
  opts?: { teamId?: string; year?: number }
): Promise<UtilizationRow[]> {
  requireRole(ctx, 'MANAGER');
  const year = opts?.year ?? currentYear();
  const conds: SQL[] = [
    eq(schema.leave.orgId, ctx.orgId),
    gte(schema.leave.startDate, yearStart(year)),
    lte(schema.leave.startDate, yearEnd(year)),
  ];
  if (opts?.teamId) conds.push(eq(schema.leave.teamId, opts.teamId));
  const rows = await db
    .select({
      leaveTypeId: schema.leave.leaveTypeId,
      name: schema.leaveType.name,
      taken: sql<string>`coalesce(sum(${schema.leave.workingDays}) filter (where ${schema.leave.isApproved} = 'APPROVED'), 0)`,
      planned: sql<string>`coalesce(sum(${schema.leave.workingDays}) filter (where ${schema.leave.isApproved} = 'PENDING'), 0)`,
    })
    .from(schema.leave)
    .innerJoin(schema.leaveType, eq(schema.leave.leaveTypeId, schema.leaveType.leaveTypeId))
    .where(and(...conds))
    .groupBy(schema.leave.leaveTypeId, schema.leaveType.name);
  return rows.map((r) => ({
    leaveTypeId: r.leaveTypeId,
    name: r.name,
    taken: Number(r.taken),
    planned: Number(r.planned),
  }));
}
