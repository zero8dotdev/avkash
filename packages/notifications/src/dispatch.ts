import { and, eq, inArray, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { sendEmail, sendSMS, smsConfigured, isTransient } from './providers';

// The notification spine: generic, domain-agnostic. A caller hands it intents
// (recipients with contacts + an event + payload); dispatch resolves channels,
// renders templates, writes the outbox idempotently, and calls providers. It knows
// nothing about leave/users — the domain pre-resolves who and what.

export type Channel = 'EMAIL' | 'SMS' | 'SLACK' | 'IN_APP';

export interface NotificationRecipient {
  orgId: string;
  userId?: string | null; // absent for email-only recipients (e.g. invitations)
  email?: string | null;
  phone?: string | null;
  locale?: string | null;
}

export interface NotificationIntent {
  event: string; // "leave.balance.credited"
  recipient: NotificationRecipient;
  dedupeKey: string; // unique per (recipient, event-instance); channel is appended internally
  payload: Record<string, unknown>;
}

export interface DispatchResult {
  sent: number;
  skipped: number; // already in the outbox (idempotent) or no channel/template
  failed: number;
}

type Rendered = { subject: string; body: string };
type Template = (payload: Record<string, unknown>, locale: string) => Rendered;

const humanPeriod = (key: string) => String(key).replace(/^accrual:/, '');

// event → channel → render. Add events/channels here; absence = "don't send on
// that channel". Locale is threaded through for future i18n (English for now).
const TEMPLATES: Record<string, Partial<Record<Channel, Template>>> = {
  'leave.balance.credited': {
    EMAIL: (p) => ({
      subject: `${p.amount} day(s) of ${p.leaveType} leave credited`,
      body: `Hi ${p.name ?? 'there'},\n\n${p.amount} day(s) of ${p.leaveType} leave have been credited to your balance for ${humanPeriod(String(p.period))}.\n\n— Avkash`,
    }),
    SMS: (p) => ({
      subject: '',
      body: `Avkash: ${p.amount} day(s) of ${p.leaveType} leave credited for ${humanPeriod(String(p.period))}.`,
    }),
  },
  'org.invitation.sent': {
    EMAIL: (p) => ({
      subject: `You're invited to ${p.orgName} on Avkash`,
      body: `Hi,\n\n${p.inviterName ?? 'A teammate'} invited you to join ${p.orgName} on Avkash as ${p.role}.\n\nAccept your invitation:\n${p.acceptUrl}\n\nThis invite expires on ${p.expiresOn}. If you didn't expect this, you can ignore it.\n\n— Avkash`,
    }),
  },
  // ── Leave approval loop ──────────────────────────────────────────────────
  'leave.requested': {
    EMAIL: (p) => ({
      subject: `Leave request from ${p.requester}`,
      body: `Hi,\n\n${p.requester} requested ${p.leaveType} leave from ${p.from} to ${p.to} (${p.days} day(s)).\n\nReview and approve it in Avkash.\n\n— Avkash`,
    }),
  },
  'leave.approved': {
    EMAIL: (p) => ({
      subject: `Your ${p.leaveType} leave was approved`,
      body: `Hi ${p.name ?? 'there'},\n\nYour ${p.leaveType} leave from ${p.from} to ${p.to} (${p.days} day(s)) has been approved. Enjoy!\n\n— Avkash`,
    }),
  },
  'leave.rejected': {
    EMAIL: (p) => ({
      subject: `Your ${p.leaveType} leave was declined`,
      body: `Hi ${p.name ?? 'there'},\n\nYour ${p.leaveType} leave from ${p.from} to ${p.to} (${p.days} day(s)) was declined. Reach out to your manager if you have questions.\n\n— Avkash`,
    }),
  },
  'leave.escalated': {
    EMAIL: (p) => ({
      subject: `Leave needs HR review`,
      body: `Hi,\n\nA ${p.leaveType} leave for ${p.requester} (${p.from} → ${p.to}, ${p.days} day(s)) needs HR attention.\nReason: ${p.reason}\n\nReview it in Avkash.\n\n— Avkash`,
    }),
  },
};

// Which channels a recipient gets this event on. EMAIL whenever an email exists;
// SMS only when the recipient has a (verified) phone AND a real SMS provider is
// configured — so we never auto-select a channel we can't actually deliver, and
// never console-spam SMS in dev. SLACK/IN_APP land in a later phase. This is the
// minimal channel-preference policy; a per-user/per-event override slots in here.
function resolveChannels(_event: string, r: NotificationRecipient): Channel[] {
  const channels: Channel[] = [];
  if (r.email) channels.push('EMAIL');
  if (r.phone && smsConfigured()) channels.push('SMS');
  return channels;
}

const contactFor = (channel: Channel, r: NotificationRecipient): string | null =>
  channel === 'EMAIL' ? (r.email ?? null) : channel === 'SMS' ? (r.phone ?? null) : null;

async function deliver(channel: Channel, to: string, rendered: Rendered, idempotencyKey: string): Promise<void> {
  if (channel === 'EMAIL') return sendEmail({ to, subject: rendered.subject, text: rendered.body }, { idempotencyKey });
  if (channel === 'SMS') return sendSMS(to, rendered.body);
  // SLACK / IN_APP providers arrive in a later phase.
}

// Retry policy. Exponential backoff with jitter, capped — so a recovering provider
// isn't hammered and a fleet of failures doesn't retry in lockstep (thundering herd).
const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 60_000; // 1 minute
const RETRY_CAP_MS = 60 * 60_000; // 1 hour

function backoffMs(attempts: number): number {
  const base = Math.min(RETRY_BASE_MS * 2 ** (attempts - 1), RETRY_CAP_MS);
  return Math.round(base + base * 0.2 * Math.random()); // +0–20% jitter
}

// One outbox row, enough to (re)attempt delivery without re-resolving anything.
interface OutboxRow {
  id: string;
  channel: Channel;
  to: string;
  subject: string | null;
  body: string | null;
  dedupeKey: string;
  attempts: number;
}

type Outcome = 'sent' | 'retry' | 'dead';

// Attempt delivery of a single outbox row and record the result. Shared by the
// initial dispatch and the retry sweep, so the classification lives in one place:
// success → SENT; transient failure within budget → FAILED + a backoff nextAttemptAt;
// permanent failure or exhausted budget → DEAD (dead-letter, never retried).
async function attemptDelivery(row: OutboxRow): Promise<Outcome> {
  const attempts = row.attempts + 1;
  try {
    await deliver(row.channel, row.to, { subject: row.subject ?? '', body: row.body ?? '' }, row.dedupeKey);
    await db
      .update(schema.notification)
      .set({ status: 'SENT', attempts, sentAt: new Date(), nextAttemptAt: null, error: null })
      .where(eq(schema.notification.id, row.id));
    return 'sent';
  } catch (err) {
    const retry = isTransient(err) && attempts < MAX_ATTEMPTS;
    await db
      .update(schema.notification)
      .set({
        status: retry ? 'FAILED' : 'DEAD',
        attempts,
        error: err instanceof Error ? err.message : String(err),
        nextAttemptAt: retry ? new Date(Date.now() + backoffMs(attempts)) : null,
      })
      .where(eq(schema.notification.id, row.id));
    return retry ? 'retry' : 'dead';
  }
}

// Fan each intent across its resolved channels. The outbox insert is the idempotency
// gate: onConflictDoNothing on dedupeKey means an already-emitted notification is
// skipped, so re-running the trigger never double-sends. First delivery is attempted
// inline; transient failures are left FAILED for the sweep to retry.
export async function dispatch(intents: NotificationIntent[]): Promise<DispatchResult> {
  const tasks = intents.flatMap((intent) =>
    resolveChannels(intent.event, intent.recipient).map((channel) => ({ intent, channel }))
  );

  const outcomes = await Promise.all(
    tasks.map(async ({ intent, channel }): Promise<keyof DispatchResult> => {
      const template = TEMPLATES[intent.event]?.[channel];
      const to = contactFor(channel, intent.recipient);
      if (!template || !to) return 'skipped';

      const rendered = template(intent.payload, intent.recipient.locale ?? 'en');
      const dedupeKey = `${intent.dedupeKey}:${channel}`;
      const [row] = await db
        .insert(schema.notification)
        .values({
          orgId: intent.recipient.orgId,
          userId: intent.recipient.userId ?? null,
          channel,
          event: intent.event,
          dedupeKey,
          to,
          payload: intent.payload,
          subject: rendered.subject || null,
          body: rendered.body,
          status: 'PENDING',
        })
        .onConflictDoNothing({ target: schema.notification.dedupeKey })
        .returning({ id: schema.notification.id });

      if (!row) return 'skipped'; // already emitted — idempotent no-op

      const outcome = await attemptDelivery({
        id: row.id,
        channel,
        to,
        subject: rendered.subject,
        body: rendered.body,
        dedupeKey,
        attempts: 0,
      });
      return outcome === 'sent' ? 'sent' : 'failed';
    })
  );

  return {
    sent: outcomes.filter((o) => o === 'sent').length,
    skipped: outcomes.filter((o) => o === 'skipped').length,
    failed: outcomes.filter((o) => o === 'failed').length,
  };
}

export interface SweepResult {
  claimed: number;
  sent: number;
  stillFailing: number;
  dead: number;
}

// Reconciliation sweep (the janitor): re-deliver FAILED rows whose backoff has
// elapsed. Rows are claimed by leasing nextAttemptAt forward, and the lease UPDATE
// re-checks `nextAttemptAt <= now`, so two concurrent sweeps can't grab the same row
// (a compare-and-set). Bounded per run; the provider Idempotency-Key keeps even a
// rare double-attempt safe.
const SWEEP_BATCH = 200;
const LEASE_MS = 5 * 60_000;

export async function retryFailedNotifications(now: Date = new Date()): Promise<SweepResult> {
  const due = await db
    .select({ id: schema.notification.id })
    .from(schema.notification)
    .where(and(eq(schema.notification.status, 'FAILED'), lte(schema.notification.nextAttemptAt, now)))
    .orderBy(schema.notification.nextAttemptAt)
    .limit(SWEEP_BATCH);
  if (!due.length) return { claimed: 0, sent: 0, stillFailing: 0, dead: 0 };

  const claimed = await db
    .update(schema.notification)
    .set({ nextAttemptAt: new Date(now.getTime() + LEASE_MS) })
    .where(
      and(
        inArray(
          schema.notification.id,
          due.map((d) => d.id)
        ),
        eq(schema.notification.status, 'FAILED'),
        lte(schema.notification.nextAttemptAt, now)
      )
    )
    .returning({
      id: schema.notification.id,
      channel: schema.notification.channel,
      to: schema.notification.to,
      subject: schema.notification.subject,
      body: schema.notification.body,
      dedupeKey: schema.notification.dedupeKey,
      attempts: schema.notification.attempts,
    });

  const outcomes = await Promise.all(claimed.map((row) => attemptDelivery(row)));
  return {
    claimed: claimed.length,
    sent: outcomes.filter((o) => o === 'sent').length,
    stillFailing: outcomes.filter((o) => o === 'retry').length,
    dead: outcomes.filter((o) => o === 'dead').length,
  };
}
