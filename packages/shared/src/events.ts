import type { z } from 'zod';
import type { AuthContext } from './context';

// Domain events (contracts only).
// An event is a *reaction trigger*, not a query: synchronous cross-domain reads stay
// direct function calls. publish() writes the outbox row in the SAME transaction as
// the domain mutation (no dual-write); a relay drains the outbox and fans out.
// Delivery is at-least-once → every subscriber MUST be idempotent (key on event.id).

export type ActorType = AuthContext['actorType'];

export interface DomainEvent<P = unknown> {
  /** event_outbox PK — the idempotency key for every subscriber. */
  id: string;
  /** '<entity>.<sub-entity>.<verb>' — see ORG_GRAPH_EVENTS for the canonical catalog. */
  name: string;
  orgId: string;
  /** From AuthContext; null for system actors (cron, relay). */
  actorId: string | null;
  actorType: ActorType;
  payload: P;
  occurredAt: Date;
  requestId: string | null;
}

/** Pairs an event name with its payload schema. Created via defineEvent() in @avkash/events. */
export interface EventDef<P> {
  name: string;
  schema: z.ZodType<P>;
}

/** A module's reaction to an event, declared in its manifest. Wired by the registry; the
 *  entitlement gate wraps the handler (disabled module ⇒ inert subscriber). */
export interface EventSubscriber<P = unknown> {
  /** Unique within the module: '<moduleKey>.<purpose>' — used for logging + idempotency scoping. */
  key: string;
  /** Event name this subscriber reacts to. */
  event: string;
  handler: (event: DomainEvent<P>) => Promise<void>;
}

// ── Org-graph event catalog ───────────────────────────────────────────────────
// The events the FGA tuple-writer consumes. Names are stable contracts;
// payload schemas live in @avkash/events. The tuple-writer is
// STATE-BASED — it re-reads current truth from Postgres on any of these — so coarse
// "changed" semantics are sufficient for sync correctness; finer verbs exist where
// other subscribers care about the distinction.
export const ORG_GRAPH_EVENTS = {
  ORG_CREATED: 'org.organisation.created',
  ORG_ROLE_CHANGED: 'org.member.role_changed',
  BUSINESS_UNIT_CHANGED: 'org.business_unit.changed',
  DEPARTMENT_CHANGED: 'org.department.changed',
  TEAM_CHANGED: 'team.team.changed',
  TEAM_MEMBER_ADDED: 'team.member.added',
  TEAM_MEMBER_REMOVED: 'team.member.removed',
  EMPLOYEE_TRANSFERRED: 'employee.transfer.completed',
  DELEGATION_CREATED: 'delegation.delegation.created',
  DELEGATION_REVOKED: 'delegation.delegation.revoked',
} as const;

export type OrgGraphEventName = (typeof ORG_GRAPH_EVENTS)[keyof typeof ORG_GRAPH_EVENTS];
