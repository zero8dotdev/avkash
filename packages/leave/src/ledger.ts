import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { db, schema, type NewLeaveLedger } from '@avkash/db'

export const todayStr = (d: Date = new Date()) => d.toISOString().slice(0, 10)
export const currentYear = (d: Date = new Date()) => d.getUTCFullYear()
export const yearStart = (year: number) => `${year}-01-01`
export const yearEnd = (year: number) => `${year}-12-31`

export async function postLedger(entry: NewLeaveLedger): Promise<void> {
  await db.insert(schema.leaveLedger).values(entry)
}

// Σ amount of valid ledger entries with effectiveOn in [from,to], not expired as of `to`.
export async function ledgerBalance(
  orgId: string,
  userId: string,
  leaveTypeId: string,
  from: string,
  to: string,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.leaveLedger.amount}), 0)` })
    .from(schema.leaveLedger)
    .where(
      and(
        eq(schema.leaveLedger.orgId, orgId),
        eq(schema.leaveLedger.userId, userId),
        eq(schema.leaveLedger.leaveTypeId, leaveTypeId),
        gte(schema.leaveLedger.effectiveOn, from),
        lte(schema.leaveLedger.effectiveOn, to),
        or(isNull(schema.leaveLedger.expiresOn), gte(schema.leaveLedger.expiresOn, to)),
      ),
    )
  return Number(row?.total ?? 0)
}

// Σ workingDays of the user's leaves at a status, scoped to leaves starting in [from,to].
async function sumLeaveDays(
  orgId: string,
  userId: string,
  leaveTypeId: string,
  status: 'APPROVED' | 'PENDING',
  from: string,
  to: string,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.leave.workingDays}), 0)` })
    .from(schema.leave)
    .where(
      and(
        eq(schema.leave.orgId, orgId),
        eq(schema.leave.userId, userId),
        eq(schema.leave.leaveTypeId, leaveTypeId),
        eq(schema.leave.isApproved, status),
        gte(schema.leave.startDate, from),
        lte(schema.leave.startDate, to),
      ),
    )
  return Number(row?.total ?? 0)
}

export const takenDays = (o: string, u: string, t: string, from: string, to: string) =>
  sumLeaveDays(o, u, t, 'APPROVED', from, to)
export const plannedDays = (o: string, u: string, t: string, from: string, to: string) =>
  sumLeaveDays(o, u, t, 'PENDING', from, to)
