import { db, schema } from '@avkash/db';
import { type AuthContext, ValidationError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { postLedger, todayStr, currentYear, yearStart } from './ledger';
import { getBalance, type LeaveBalance } from './balance';
import { writeAudit } from './audit';

export interface AdjustBalanceInput {
  userId: string;
  leaveTypeId: string;
  amount: number; // signed: + grants, − deducts
  note: string;
}

// HR correction/grant: post a signed ADJUSTMENT entry. Distinct entries accumulate,
// so an HR can adjust repeatedly; the ledger sum carries it into the balance.
export async function adjustBalance(ctx: AuthContext, input: AdjustBalanceInput): Promise<LeaveBalance> {
  requireRole(ctx, 'ADMIN');
  if (!Number.isFinite(input.amount) || input.amount === 0) throw new ValidationError('AMOUNT_NONZERO');
  await postLedger({
    orgId: ctx.orgId,
    userId: input.userId,
    leaveTypeId: input.leaveTypeId,
    kind: 'ADJUSTMENT',
    amount: String(input.amount),
    effectiveOn: todayStr(),
    note: input.note,
    createdBy: ctx.userId,
  });
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeaveLedger',
    keyword: 'balance_adjust',
    changed: { userId: input.userId, leaveTypeId: input.leaveTypeId, amount: input.amount, note: input.note },
    changedBy: ctx.userId,
  });
  return getBalance(ctx, input.userId, input.leaveTypeId);
}

export interface OpeningBalanceInput {
  userId: string;
  leaveTypeId: string;
  amount: number;
  year?: number;
  note?: string;
}

// Seed an initial balance for an employee onboarded with days already banked. Exactly
// one OPENING entry per (user, type, year) — re-setting corrects it (idempotent via
// the periodKey), so a mistaken opening is overwritten, not duplicated.
export async function setOpeningBalance(ctx: AuthContext, input: OpeningBalanceInput): Promise<LeaveBalance> {
  requireRole(ctx, 'ADMIN');
  if (!Number.isFinite(input.amount)) throw new ValidationError('AMOUNT_NONZERO');
  const year = input.year ?? currentYear();
  await db
    .insert(schema.leaveLedger)
    .values({
      orgId: ctx.orgId,
      userId: input.userId,
      leaveTypeId: input.leaveTypeId,
      kind: 'OPENING',
      amount: String(input.amount),
      effectiveOn: yearStart(year),
      periodKey: `opening:${year}`,
      note: input.note ?? 'opening balance',
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [schema.leaveLedger.userId, schema.leaveLedger.leaveTypeId, schema.leaveLedger.periodKey],
      set: { amount: String(input.amount), note: input.note ?? 'opening balance' },
    });
  await writeAudit({
    orgId: ctx.orgId,
    tableName: 'LeaveLedger',
    keyword: 'opening_balance',
    changed: { userId: input.userId, leaveTypeId: input.leaveTypeId, amount: input.amount, year },
    changedBy: ctx.userId,
  });
  return getBalance(ctx, input.userId, input.leaveTypeId, year);
}
