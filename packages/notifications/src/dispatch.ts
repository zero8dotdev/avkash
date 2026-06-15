import { and, eq, inArray, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { renderEmail } from '@avkash/emails';
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

const humanPeriod = (key: unknown) => String(key ?? '').replace(/^accrual:/, '');

// EMAIL content is React Email (see @avkash/emails). SMS stays plain text here —
// short, no markup. event → SMS body; absence = don't send an SMS for that event.
const SMS_TEMPLATES: Record<string, (p: Record<string, unknown>) => string> = {
  'leave.balance.credited': (p) =>
    `Avkash: ${p.amount} day(s) of ${p.leaveType} leave credited for ${humanPeriod(p.period)}.`,
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

// One outbox row, enough to (re)attempt delivery without re-resolving anything.
interface OutboxRow {
  id: string;
  channel: Channel;
  to: string;
  subject: string | null;
  body: string | null; // plain-text part (EMAIL) or the SMS text
  event: string;
  payload: Record<string, unknown>;
  dedupeKey: string;
  attempts: number;
}

// Deliver one outbox row. EMAIL renders its HTML fresh from the stored event +
// payload — so the body column stays human-readable plain text (clean console/audit)
// and a retry renders byte-identically; the stored body is the plain-text part. SMS
// sends the stored text as-is.
async function deliver(row: OutboxRow, idempotencyKey: string): Promise<void> {
  if (row.channel === 'EMAIL') {
    const email = await renderEmail(row.event, row.payload);
    return sendEmail(
      {
        to: row.to,
        subject: email?.subject ?? row.subject ?? '',
        html: email?.html,
        text: email?.text ?? row.body ?? '',
      },
      { idempotencyKey }
    );
  }
  if (row.channel === 'SMS') return sendSMS(row.to, row.body ?? '');
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

type Outcome = 'sent' | 'retry' | 'dead';

// Attempt delivery of a single outbox row and record the result. Shared by the
// initial dispatch and the retry sweep, so the classification lives in one place:
// success → SENT; transient failure within budget → FAILED + a backoff nextAttemptAt;
// permanent failure or exhausted budget → DEAD (dead-letter, never retried).
async function attemptDelivery(row: OutboxRow): Promise<Outcome> {
  const attempts = row.attempts + 1;
  try {
    await deliver(row, row.dedupeKey);
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
      const to = contactFor(channel, intent.recipient);
      if (!to) return 'skipped';

      // Content for the channel. EMAIL → React Email (subject + plain-text stored in
      // the outbox; HTML is rendered at delivery). SMS → inline text. No template for
      // this event+channel → skip.
      let subject: string | null = null;
      let body: string;
      if (channel === 'EMAIL') {
        const email = await renderEmail(intent.event, intent.payload);
        if (!email) return 'skipped';
        subject = email.subject;
        body = email.text;
      } else if (channel === 'SMS') {
        const sms = SMS_TEMPLATES[intent.event];
        if (!sms) return 'skipped';
        body = sms(intent.payload);
      } else {
        return 'skipped';
      }

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
          subject: subject || null,
          body,
          status: 'PENDING',
        })
        .onConflictDoNothing({ target: schema.notification.dedupeKey })
        .returning({ id: schema.notification.id });

      if (!row) return 'skipped'; // already emitted — idempotent no-op

      const outcome = await attemptDelivery({
        id: row.id,
        channel,
        to,
        subject,
        body,
        event: intent.event,
        payload: intent.payload,
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
      event: schema.notification.event,
      payload: schema.notification.payload,
      dedupeKey: schema.notification.dedupeKey,
      attempts: schema.notification.attempts,
    });

  const outcomes = await Promise.all(
    claimed.map((row) => attemptDelivery({ ...row, payload: (row.payload ?? {}) as Record<string, unknown> }))
  );
  return {
    claimed: claimed.length,
    sent: outcomes.filter((o) => o === 'sent').length,
    stillFailing: outcomes.filter((o) => o === 'retry').length,
    dead: outcomes.filter((o) => o === 'dead').length,
  };
}
