import type { DomainEvent, EventDef, EventSubscriber } from '@avkash/shared';

// ── In-process subscriber registry ───────────────────────────────────────────
// Maps event names to all subscribers that care about them. The relay calls
// getSubscribers(name) to fan out after draining an outbox row.
//
// Subscribers MUST be idempotent — the relay delivers at-least-once.
// Key on event.id (the outbox row PK) for deduplication.

type AnyHandler = (event: DomainEvent<unknown>) => Promise<void>;

interface RegistryEntry {
  key: string;
  handler: AnyHandler;
}

// Module-level singleton — the registry lives for the process lifetime.
const _registry = new Map<string, RegistryEntry[]>();

/**
 * Register a subscriber for an event.
 *
 * Accepts either an `EventDef<P>` (for type-safe wiring) or a raw event name
 * string (for dynamic/programmatic registration).
 *
 * At-least-once delivery: the handler will be called at minimum once per
 * distinct outbox row. Idempotency MUST be enforced by the handler, keyed on
 * `event.id` (the event_outbox PK).
 */
export function subscribe<P>(defOrName: EventDef<P> | string, subscriber: EventSubscriber<P>): void {
  const name = typeof defOrName === 'string' ? defOrName : defOrName.name;
  const existing = _registry.get(name) ?? [];
  _registry.set(name, [
    ...existing,
    {
      key: subscriber.key,
      // Type-erase the handler so the registry is homogeneous.
      handler: subscriber.handler as AnyHandler,
    },
  ]);
}

/**
 * Returns all subscriber handlers for the given event name.
 * Called by the relay — not part of the public module API.
 */
export function getSubscribers(eventName: string): RegistryEntry[] {
  return _registry.get(eventName) ?? [];
}

/**
 * Wires a full EventSubscriber array (from an AvkashModule manifest) into the
 * registry. Called by the module registry at boot.
 */
export function wireSubscribers(subscribers: EventSubscriber[]): void {
  for (const sub of subscribers) {
    const existing = _registry.get(sub.event) ?? [];
    _registry.set(sub.event, [...existing, { key: sub.key, handler: sub.handler as AnyHandler }]);
  }
}

/**
 * Reset the registry — for test isolation only. Never call in production.
 * @internal
 */
export function _resetRegistryForTest(): void {
  _registry.clear();
}
