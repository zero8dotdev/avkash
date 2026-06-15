// @avkash/events — transactional outbox event bus.
//
// DELIVERY GUARANTEE: at-least-once. Every subscriber MUST be idempotent,
// keyed on the DomainEvent.id field (the event_outbox PK). Two passes of the
// relay on the same row will call the handler twice; the handler must be
// safe to run twice.
//
// USAGE PATTERN:
//   1. Declare an event once with defineEvent() (usually in the module that owns it).
//   2. Call publish(tx, ctx, def, payload) INSIDE the domain transaction.
//   3. Register handlers with subscribe() at process boot (before startRelay()).
//   4. The relay drains the outbox and calls handlers; clean up with the stop fn.

// ── Public API ────────────────────────────────────────────────────────────────
export { defineEvent } from './define';
export { publish, publishWithRequestId } from './publish';
export type { RelayRunResult, RelayOptions } from './relay';
export { runRelayOnce, startRelay } from './relay';
export { subscribe, wireSubscribers, _resetRegistryForTest } from './registry';
export { outboxDepth, oldestUnpublishedAgeMs } from './observability';

// Re-export shared contracts so consumers only need one import.
export type { DomainEvent, EventDef, EventSubscriber } from '@avkash/shared';
