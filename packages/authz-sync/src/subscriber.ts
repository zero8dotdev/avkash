// Tuple-writer event subscriber.
//
// One subscriber wired to EVERY event name in ORG_GRAPH_EVENTS. On any
// org-graph event it calls syncOrgTuples(event.orgId) — state-based, so the
// event payload is ignored entirely (except for orgId).
//
// IDEMPOTENT BY CONSTRUCTION:
//   - The writer derives expected tuples fresh from Postgres on every call.
//   - Replaying the same event, reordering events, or delivering duplicates
//     all produce the same final FGA state because the computation is based on
//     the current Postgres snapshot, not a sequence of deltas.
//   - The relay's at-least-once guarantee is therefore safe: even if this
//     handler runs multiple times for the same event.id, the second (and any
//     subsequent) run is a no-op (diff produces empty write/delete lists).
//
// KEY CONVENTION: 'authz-sync.<event-name>' — used for logging and idempotency
// scoping in subscriber registration.

import { ORG_GRAPH_EVENTS, type EventSubscriber } from '@avkash/shared';
import { syncOrgTuples } from './sync';

// Build one subscriber per event name so the relay can fan out independently
// and each one appears in logs with its own key.
function makeTupleWriterSubscriber(eventName: string): EventSubscriber {
  return {
    key: `authz-sync.${eventName}`,
    event: eventName,
    handler: async (event) => {
      const start = Date.now();
      try {
        const result = await syncOrgTuples(event.orgId);
        const ms = Date.now() - start;
        // Only log if there were actual writes to avoid spamming logs.
        if (result.written > 0 || result.deleted > 0) {
          console.log(
            `[authz-sync] ${eventName} → org ${event.orgId}: ` +
              `+${result.written} writes, -${result.deleted} deletes (${ms}ms)`
          );
        }
      } catch (err) {
        const ms = Date.now() - start;
        console.error(
          `[authz-sync] ${eventName} → org ${event.orgId} FAILED after ${ms}ms:`,
          err instanceof Error ? err.message : String(err)
        );
        // Re-throw so the relay marks this outbox row as failed and retries.
        throw err;
      }
    },
  };
}

/**
 * One subscriber per ORG_GRAPH_EVENTS entry. Wire all of these into the relay
 * via wireSubscribers() or subscribe() at process boot.
 *
 * Usage in apps/worker:
 *   import { wireSubscribers } from '@avkash/events';
 *   import { tupleWriterSubscribers } from '@avkash/authz-sync';
 *   wireSubscribers(tupleWriterSubscribers);
 */
export const tupleWriterSubscribers: EventSubscriber[] = Object.values(ORG_GRAPH_EVENTS).map(makeTupleWriterSubscriber);
