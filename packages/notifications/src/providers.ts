import { env } from '@avkash/config';

// Delivery providers behind a stable interface (the adapter/driver pattern). The
// dispatcher and auth callbacks call sendEmail/sendSMS and never know which concrete
// provider runs — that's chosen once at boot from env. Absent keys fall back to the
// console provider, so the whole app works end-to-end with zero provider config; set
// the keys to go live without touching a single caller.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string; // plain-text part (also the dev console body)
  html?: string; // rich part (React Email); when present, providers send both
}

export interface EmailProvider {
  readonly name: string;
  // idempotencyKey (when the provider supports it, e.g. Resend) makes a retried send
  // a no-op on their side too — layered on top of our outbox dedupe.
  send(msg: EmailMessage, opts?: { idempotencyKey?: string }): Promise<void>;
}

export interface SmsProvider {
  readonly name: string;
  send(to: string, text: string): Promise<void>;
}

// Providers throw this so the dispatcher can classify the failure. status is the
// HTTP status when there was a response; absent means a network/transport error.
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// Transient = worth retrying: rate-limit (429), request-timeout (408), too-early
// (425), or any 5xx; and network errors (no status). Everything else (4xx
// validation: bad address, bad request) is permanent — retrying only wastes budget.
export function isTransient(err: unknown): boolean {
  if (err instanceof ProviderError && err.status != null) {
    return err.status === 408 || err.status === 425 || err.status === 429 || err.status >= 500;
  }
  return true; // unknown / network error → transient (still capped by max attempts)
}

// ── Console (dev fallback) ──────────────────────────────────────────────────
class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';

  async send(msg: EmailMessage): Promise<void> {
    console.log(`\n📧 [email → ${msg.to}] ${msg.subject}\n${msg.text}\n`);
  }
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';

  async send(to: string, text: string): Promise<void> {
    console.log(`\n📱 [sms → ${to}] ${text}\n`);
  }
}

// ── Resend (email) ──────────────────────────────────────────────────────────
// Thin REST call over Bun/Node fetch — no SDK dependency. Throws on a non-2xx so
// the dispatcher records FAILED with the provider's message (sets up retry in 3c).
class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(msg: EmailMessage, opts?: { idempotencyKey?: string }): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from: this.from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ProviderError(`resend ${res.status}: ${body.slice(0, 200)}`, res.status);
    }
  }
}

// ── MSG91 (SMS) ─────────────────────────────────────────────────────────────
// Skeleton for the MSG91 v5 flow API. In India SMS is template-bound (DLT): the
// body is delivered as a template variable, not free text. Finish the variable
// mapping (`var1` below) to match your registered DLT template when you have it.
class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';

  constructor(
    private readonly authKey: string,
    private readonly senderId: string,
    private readonly templateId: string
  ) {}

  async send(to: string, text: string): Promise<void> {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: this.authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: this.templateId,
        sender: this.senderId,
        recipients: [{ mobiles: to.replace(/[^\d]/g, ''), var1: text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ProviderError(`msg91 ${res.status}: ${body.slice(0, 200)}`, res.status);
    }
  }
}

// ── Selection (once, at boot) ───────────────────────────────────────────────
const emailProvider: EmailProvider =
  env.RESEND_API_KEY && env.RESEND_FROM
    ? new ResendEmailProvider(env.RESEND_API_KEY, env.RESEND_FROM)
    : new ConsoleEmailProvider();

// SMS falls back to console so auth OTP still works in dev, but smsConfigured()
// reports false unless a REAL provider is wired — the dispatcher uses that to avoid
// auto-selecting SMS (and console-spamming) for every notification.
const smsProvider: SmsProvider =
  env.MSG91_AUTH_KEY && env.MSG91_SENDER_ID && env.MSG91_TEMPLATE_ID
    ? new Msg91SmsProvider(env.MSG91_AUTH_KEY, env.MSG91_SENDER_ID, env.MSG91_TEMPLATE_ID)
    : new ConsoleSmsProvider();

export const sendEmail = (msg: EmailMessage, opts?: { idempotencyKey?: string }) => emailProvider.send(msg, opts);
export const sendSMS = (to: string, text: string) => smsProvider.send(to, text);

// True only when a real SMS transport is configured. Channel resolution uses this
// to decide whether SMS is a deliverable channel.
export const smsConfigured = () => smsProvider.name !== 'console';
