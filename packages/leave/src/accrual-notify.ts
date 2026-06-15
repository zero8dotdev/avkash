import { inArray } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { dispatch, type DispatchResult, type NotificationIntent } from '@avkash/notifications';
import { runAccrualTick, type AccrualCredit } from './accrual';

// Bridge accrual credits → notifications. Leave owns "who got what" (it resolves the
// recipient's contact + locale and the leave type's display name); the notifications
// spine owns channel/template/delivery. The dedupeKey is per (period, user, type),
// so a re-run of the daily tick re-emits nothing — notify-once, same discipline as
// the ledger itself.
export async function notifyAccrualCredits(credits: AccrualCredit[]): Promise<DispatchResult> {
  if (!credits.length) return { sent: 0, skipped: 0, failed: 0 };

  const userIds = [...new Set(credits.map((c) => c.userId))];
  const typeIds = [...new Set(credits.map((c) => c.leaveTypeId))];
  const [users, types] = await Promise.all([
    db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        language: schema.user.language,
        phone: schema.user.phoneNumber,
        phoneVerified: schema.user.phoneNumberVerified,
      })
      .from(schema.user)
      .where(inArray(schema.user.id, userIds)),
    db
      .select({ leaveTypeId: schema.leaveType.leaveTypeId, name: schema.leaveType.name })
      .from(schema.leaveType)
      .where(inArray(schema.leaveType.leaveTypeId, typeIds)),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const typeMap = new Map(types.map((t) => [t.leaveTypeId, t.name]));

  const intents: NotificationIntent[] = credits.map((c) => {
    const u = userMap.get(c.userId);
    return {
      event: 'leave.balance.credited',
      recipient: {
        orgId: c.orgId,
        userId: c.userId,
        email: u?.email,
        phone: u?.phoneVerified ? u?.phone : null, // only message verified numbers
        locale: u?.language,
      },
      dedupeKey: `leave.balance.credited:${c.periodKey}:${c.userId}:${c.leaveTypeId}`,
      payload: {
        name: u?.name,
        amount: c.amount,
        leaveType: typeMap.get(c.leaveTypeId) ?? 'leave',
        period: c.periodKey,
      },
    };
  });
  return dispatch(intents);
}

// The full daily accrual cycle: credit the ledger, then notify whoever was credited.
// One definition shared by the scheduler (the worker) and the manual /internal
// trigger, so they can't drift. Idempotent end-to-end (ledger + outbox dedupe).
export async function runAccrualCycle(now?: Date): Promise<{ date: string; posted: number; notified: DispatchResult }> {
  const { date, posted, credits } = await runAccrualTick(now);
  const notified = await notifyAccrualCredits(credits);
  return { date, posted, notified };
}
