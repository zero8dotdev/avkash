import { asc, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { DomainEvent } from '@avkash/shared';
import { getSubscribers } from './registry';

// ── Relay ─────────────────────────────────────────────────────────────────────
// Drains unpublished event_outbox rows (oldest first) and fans out to every
// registered in-process subscriber. Delivery is at-least-once: if a row was
// claimed but the process crashed before publishedAt was set, the next relay
// pass re-delivers it. Subscribers MUST be idempotent, keyed on event.id.
//
// TODO: add Postgres LISTEN/NOTIFY to the startRelay loop for sub-second
// latency on the hot path (poll is the safe fallback for cold starts and
// multi-instance consistency).

// Hard cap on attempts before a row is considered permanently failed and left
// for human triage. This mirrors the notification retry policy.
const MAX_ATTEMPTS = 5;

// Rows to process per runRelayOnce() call. Large batches consume more memory;
// small batches incur more round-trips. 100 is a reasonable default.
const RELAY_BATCH = 100;

export interface RelayRunResult {
  processed: number;
  failed: number;
  skipped: number; // attempts >= MAX_ATTEMPTS — left for triage
}

/**
 * One drain pass: read up to RELAY_BATCH unpublished rows (oldest first),
 * fan out to subscribers, mark publishedAt on success, increment attempts +
 * set lastError on failure.
 *
 * Idempotent: rows already published (publishedAt != null) are filtered by
 * the partial index and never returned. A row that exceeds MAX_ATTEMPTS is
 * left untouched and counted as `skipped`.
 */
export async function runRelayOnce(): Promise<RelayRunResult> {
  const now = new Date();

  // Claim a batch of unpublished rows. We read all unpublished rows regardless
  // of attempt count so we can count skipped; the filter below gates retries.
  const rows = await db
    .select()
    .from(schema.eventOutbox)
    .where(isNull(schema.eventOutbox.publishedAt))
    .orderBy(asc(schema.eventOutbox.occurredAt))
    .limit(RELAY_BATCH);

  if (!rows.length) return { processed: 0, failed: 0, skipped: 0 };

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    // Rows that have already exhausted retries are left for human triage.
    if (row.attempts >= MAX_ATTEMPTS) {
      skipped++;
      continue;
    }

    const event: DomainEvent<unknown> = {
      id: row.id,
      name: row.name,
      orgId: row.orgId,
      actorId: row.actorId ?? null,
      // actorType stored as varchar; cast to the union. Unknown values default to 'system'.
      actorType: (row.actorType as DomainEvent<unknown>['actorType']) ?? 'system',
      payload: row.payload,
      occurredAt: row.occurredAt,
      requestId: row.requestId ?? null,
    };

    const subscribers = getSubscribers(row.name);

    try {
      // Fan out to all subscribers. Failures in one subscriber do not prevent
      // the others from running; any error marks the row as failed.
      const results = await Promise.allSettled(subscribers.map((s) => s.handler(event)));

      const anyFailed = results.some((r) => r.status === 'rejected');
      if (anyFailed) {
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => String(r.reason))
          .join('; ');
        await db
          .update(schema.eventOutbox)
          .set({ attempts: row.attempts + 1, lastError: errors })
          .where(sql`${schema.eventOutbox.id} = ${row.id}`);
        failed++;
      } else {
        await db
          .update(schema.eventOutbox)
          .set({ publishedAt: now, attempts: row.attempts + 1, lastError: null })
          .where(sql`${schema.eventOutbox.id} = ${row.id}`);
        processed++;
      }
    } catch (err) {
      // Unexpected error (e.g. DB failure during fan-out) — record it and move on.
      await db
        .update(schema.eventOutbox)
        .set({ attempts: row.attempts + 1, lastError: err instanceof Error ? err.message : String(err) })
        .where(sql`${schema.eventOutbox.id} = ${row.id}`);
      failed++;
    }
  }

  return { processed, failed, skipped };
}

export interface RelayOptions {
  /** How often to poll for unpublished events, in milliseconds. Default: 5000. */
  intervalMs?: number;
  /** Optional callback invoked after each run (for logging / metrics). */
  onRun?: (result: RelayRunResult) => void;
  /** Optional callback invoked on unexpected relay errors (outside individual row failures). */
  onError?: (err: unknown) => void;
}

/**
 * Start the poll-based relay loop. Returns a stop function that resolves when
 * the current pass finishes and clears the timer, suitable for clean shutdown.
 *
 * Usage in apps/worker:
 *   const stopRelay = startRelay({ intervalMs: 5000 });
 *   // on SIGTERM:
 *   await stopRelay();
 */
export function startRelay(opts: RelayOptions = {}): () => Promise<void> {
  const intervalMs = opts.intervalMs ?? 5_000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;
  let stopResolve: (() => void) | null = null;
  const stopPromise = new Promise<void>((resolve) => {
    stopResolve = resolve;
  });

  const tick = async () => {
    if (stopped) {
      stopResolve?.();
      return;
    }
    running = true;
    try {
      const result = await runRelayOnce();
      opts.onRun?.(result);
    } catch (err) {
      opts.onError?.(err);
    } finally {
      running = false;
      if (!stopped) {
        timer = setTimeout(() => void tick(), intervalMs);
      } else {
        stopResolve?.();
      }
    }
  };

  // Kick off immediately then poll.
  timer = setTimeout(() => void tick(), 0);

  return async () => {
    stopped = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    // If a tick is in flight, wait for it to finish.
    if (running) {
      await stopPromise;
    }
  };
}
