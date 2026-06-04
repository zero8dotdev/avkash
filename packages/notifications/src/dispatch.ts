import { eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { sendEmail, sendSMS } from './providers';

// The notification spine: generic, domain-agnostic. A caller hands it intents
// (recipients with contacts + an event + payload); dispatch resolves channels,
// renders templates, writes the outbox idempotently, and calls providers. It knows
// nothing about leave/users — the domain pre-resolves who and what.

export type Channel = 'EMAIL' | 'SMS' | 'SLACK' | 'IN_APP';

export interface NotificationRecipient {
  orgId: string;
  userId: string;
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
};

// Which channels a recipient should receive this event on. Today: EMAIL when an
// email exists. SMS/SLACK/IN_APP land when their providers + per-user preferences
// exist (later phase) — the structure is ready, the selection is intentionally
// conservative so we don't promise a channel we can't deliver.
function resolveChannels(_event: string, r: NotificationRecipient): Channel[] {
  const channels: Channel[] = [];
  if (r.email) channels.push('EMAIL');
  return channels;
}

const contactFor = (channel: Channel, r: NotificationRecipient): string | null =>
  channel === 'EMAIL' ? (r.email ?? null) : channel === 'SMS' ? (r.phone ?? null) : null;

async function deliver(channel: Channel, to: string, rendered: Rendered): Promise<void> {
  if (channel === 'EMAIL') return sendEmail({ to, subject: rendered.subject, text: rendered.body });
  if (channel === 'SMS') return sendSMS(to, rendered.body);
  // SLACK / IN_APP providers arrive in a later phase.
}

// Fan each intent across its resolved channels. The outbox insert is the idempotency
// gate: onConflictDoNothing on dedupeKey means an already-emitted notification is
// skipped, so re-running the trigger never double-sends.
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
      const [row] = await db
        .insert(schema.notification)
        .values({
          orgId: intent.recipient.orgId,
          userId: intent.recipient.userId,
          channel,
          event: intent.event,
          dedupeKey: `${intent.dedupeKey}:${channel}`,
          payload: intent.payload,
          subject: rendered.subject || null,
          body: rendered.body,
          status: 'PENDING',
        })
        .onConflictDoNothing({ target: schema.notification.dedupeKey })
        .returning({ id: schema.notification.id });

      if (!row) return 'skipped'; // already emitted — idempotent no-op

      try {
        await deliver(channel, to, rendered);
        await db
          .update(schema.notification)
          .set({ status: 'SENT', attempts: 1, sentAt: new Date() })
          .where(eq(schema.notification.id, row.id));
        return 'sent';
      } catch (err) {
        await db
          .update(schema.notification)
          .set({ status: 'FAILED', attempts: 1, error: err instanceof Error ? err.message : String(err) })
          .where(eq(schema.notification.id, row.id));
        return 'failed';
      }
    })
  );

  return {
    sent: outcomes.filter((o) => o === 'sent').length,
    skipped: outcomes.filter((o) => o === 'skipped').length,
    failed: outcomes.filter((o) => o === 'failed').length,
  };
}
