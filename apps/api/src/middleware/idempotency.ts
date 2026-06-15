import { createMiddleware } from 'hono/factory';
import { ConflictError } from '@avkash/shared';
import { claimIdempotencyKey, loadIdempotencyKey, completeIdempotencyKey, releaseIdempotencyKey } from '@avkash/db';
import type { AppEnv } from './auth';

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Safe retries for unsafe writes. Opt-in: a client wanting exactly-once semantics
// sends an Idempotency-Key header. The first request runs and caches its response;
// a retry with the same key replays that response instead of re-executing. Same key
// with a different body → 409 (the key is for retrying the *same* call). Runs after
// requireAuth (scoped per user) and before validateBody (replays skip validation).
export const idempotency = createMiddleware<AppEnv>(async (c, next) => {
  const key = c.req.header('idempotency-key');
  if (!key) return next(); // opt-in — no key, normal flow

  const { userId } = c.get('auth');
  if (!userId) return next(); // no actor to scope the key to

  const body = await c.req.text();
  const fingerprint = await sha256hex(`${c.req.method} ${c.req.path} ${body}`);

  const claimedId = await claimIdempotencyKey(userId, key, fingerprint);

  // Couldn't claim → the key already exists. Decide: replay, conflict, or in-flight.
  if (!claimedId) {
    const existing = await loadIdempotencyKey(userId, key);
    if (!existing) return next(); // vanished between insert+select (rare) — just run
    if (existing.fingerprint !== fingerprint) throw new ConflictError('IDEMPOTENCY_KEY_REUSED');
    if (existing.status !== 'completed') throw new ConflictError('IDEMPOTENCY_IN_PROGRESS');
    c.res = new Response(existing.responseBody, {
      status: existing.responseStatus ?? 200,
      headers: { 'content-type': 'application/json', 'idempotent-replay': 'true' },
    });
    return;
  }

  // We own the key → run the handler, then cache (or release) its response.
  try {
    await next();
  } catch (e) {
    await releaseIdempotencyKey(claimedId); // failure → let a retry genuinely re-run
    throw e;
  }
  const res = c.res.clone();
  if (res.status < 300) {
    await completeIdempotencyKey(claimedId, res.status, await res.text());
  } else {
    await releaseIdempotencyKey(claimedId); // don't cache non-2xx
  }
});
