import { eq, inArray } from 'drizzle-orm';
import { db, schema, type Leave } from '@avkash/db';
import { dispatch, type NotificationIntent, type NotificationRecipient } from '@avkash/notifications';

// Leave → notifications. Resolves recipients (approvers, requester, HR) and hands the
// notification spine pre-resolved intents. Leave owns "who/what"; notifications owns
// channel/template/delivery. Every send is dedupe-keyed per (event, leave, recipient)
// so a retry never re-notifies. Failures here never break the leave action — the
// outbox already records them and the sweep retries.

interface UserLite {
  id: string;
  name: string | null;
  email: string | null;
  language: string | null;
  phone: string | null;
  phoneVerified: boolean;
}

async function usersByIds(ids: string[]): Promise<Map<string, UserLite>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map();
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      language: schema.user.language,
      phone: schema.user.phoneNumber,
      phoneVerified: schema.user.phoneNumberVerified,
    })
    .from(schema.user)
    .where(inArray(schema.user.id, unique));
  return new Map(rows.map((u) => [u.id, u]));
}

async function leaveTypeName(leaveTypeId: string): Promise<string> {
  const [t] = await db
    .select({ name: schema.leaveType.name })
    .from(schema.leaveType)
    .where(eq(schema.leaveType.leaveTypeId, leaveTypeId))
    .limit(1);
  return t?.name ?? 'leave';
}

const recipientOf = (orgId: string, u: UserLite): NotificationRecipient => ({
  orgId,
  userId: u.id,
  email: u.email,
  phone: u.phoneVerified ? u.phone : null,
  locale: u.language,
});

const facts = (leave: Leave, leaveType: string) => ({
  leaveType,
  from: leave.startDate,
  to: leave.endDate,
  days: Number(leave.workingDays),
});

// dispatch never throws on a send failure (it records FAILED), but a DB hiccup on the
// outbox insert could throw — keep it from breaking the leave mutation that triggered it.
async function safeDispatch(intents: NotificationIntent[], label: string): Promise<void> {
  if (!intents.length) return;
  try {
    await dispatch(intents);
  } catch (err) {
    console.error(`notify ${label} failed:`, err instanceof Error ? err.message : err);
  }
}

// A new PENDING request → tell the team's managers (the approvers). Skips the
// requester themselves and teams with no managers.
export async function notifyLeaveRequested(leave: Leave): Promise<void> {
  if (!leave.teamId) return;
  const [team] = await db
    .select({ managers: schema.team.managers })
    .from(schema.team)
    .where(eq(schema.team.teamId, leave.teamId))
    .limit(1);
  const approverIds = (team?.managers ?? []).filter((id): id is string => !!id && id !== leave.userId);
  if (!approverIds.length) return;

  const [type, approvers, requesters] = await Promise.all([
    leaveTypeName(leave.leaveTypeId),
    usersByIds(approverIds),
    usersByIds([leave.userId]),
  ]);
  const requester = requesters.get(leave.userId)?.name ?? 'A teammate';
  const intents = approverIds
    .map((id) => approvers.get(id))
    .filter((u): u is UserLite => !!u)
    .map<NotificationIntent>((u) => ({
      event: 'leave.requested',
      recipient: recipientOf(leave.orgId, u),
      dedupeKey: `leave.requested:${leave.leaveId}:${u.id}`,
      payload: { requester, ...facts(leave, type) },
    }));
  await safeDispatch(intents, 'leave.requested');
}

// An approve/reject decision → tell the requester.
export async function notifyLeaveDecision(leave: Leave, status: 'APPROVED' | 'REJECTED'): Promise<void> {
  const [type, users] = await Promise.all([leaveTypeName(leave.leaveTypeId), usersByIds([leave.userId])]);
  const u = users.get(leave.userId);
  if (!u) return;
  const event = status === 'APPROVED' ? 'leave.approved' : 'leave.rejected';
  await safeDispatch(
    [
      {
        event,
        recipient: recipientOf(leave.orgId, u),
        dedupeKey: `${event}:${leave.leaveId}`,
        payload: { name: u.name, ...facts(leave, type) },
      },
    ],
    event
  );
}

// An escalation → tell HR (the designated escalatesTo user, or every ADMIN/OWNER when
// none is set). Recipient ids are resolved by the caller (escalateLeave).
export async function notifyLeaveEscalated(leave: Leave, recipientIds: string[], reason: string): Promise<void> {
  if (!recipientIds.length) return;
  const [type, recipients, requesters] = await Promise.all([
    leaveTypeName(leave.leaveTypeId),
    usersByIds(recipientIds),
    usersByIds([leave.userId]),
  ]);
  const requester = requesters.get(leave.userId)?.name ?? 'A teammate';
  const intents = recipientIds
    .map((id) => recipients.get(id))
    .filter((u): u is UserLite => !!u)
    .map<NotificationIntent>((u) => ({
      event: 'leave.escalated',
      recipient: recipientOf(leave.orgId, u),
      dedupeKey: `leave.escalated:${leave.leaveId}:${u.id}`,
      payload: { requester, reason, ...facts(leave, type) },
    }));
  await safeDispatch(intents, 'leave.escalated');
}
