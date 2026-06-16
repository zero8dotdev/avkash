// Org-graph event definitions for the tuple-sync pipeline.
//
// Payloads are deliberately minimal — {orgId} + relevant ids only. The
// tuple-writer is STATE-BASED: on any event it re-reads current truth from
// Postgres and writes FGA to match. The payload is never applied as a delta,
// so fine-grained "what changed" data is intentionally omitted to keep the
// contracts narrow and the idempotency proof simple.
//
// Each event is published INSIDE the domain mutation's transaction via
// publish(tx, ctx, def, payload) from @avkash/events, giving us the outbox
// guarantee: the event exists iff the mutation committed.

import { z } from 'zod';
import { defineEvent } from '@avkash/events';
import { ORG_GRAPH_EVENTS } from '@avkash/shared';

// ── Common payload shapes ─────────────────────────────────────────────────────

// All org-graph events carry at least orgId.
const basePayload = z.object({ orgId: z.string().uuid() });

// ── Event definitions — one per ORG_GRAPH_EVENTS entry ───────────────────────

/**
 * Emitted when an organisation is first created (bootstrap). Triggers the
 * initial FGA write to establish the org object. At this point the owner
 * may not have signed up yet — member/owner tuples are written later via
 * team membership and role events.
 */
export const orgCreatedEvent = defineEvent(ORG_GRAPH_EVENTS.ORG_CREATED, basePayload);

/**
 * Emitted when a user's org-level role changes (ADMIN↔MANAGER↔USER etc.).
 * Triggers re-sync of org member/hr_admin/owner tuples.
 */
export const orgRoleChangedEvent = defineEvent(
  ORG_GRAPH_EVENTS.ORG_ROLE_CHANGED,
  basePayload.extend({ userId: z.string().uuid() })
);

/**
 * Emitted when a business-unit is created, updated (head assigned), or
 * deactivated. Triggers re-sync of business_unit tuples.
 */
export const businessUnitChangedEvent = defineEvent(
  ORG_GRAPH_EVENTS.BUSINESS_UNIT_CHANGED,
  basePayload.extend({ businessUnitId: z.string().uuid() })
);

/**
 * Emitted when a department is created, updated (head assigned), or when its
 * business-unit link changes. Triggers re-sync of department tuples.
 */
export const departmentChangedEvent = defineEvent(
  ORG_GRAPH_EVENTS.DEPARTMENT_CHANGED,
  basePayload.extend({ departmentId: z.string().uuid() })
);

/**
 * Emitted when a team is created, updated (manager list / departmentId changes),
 * or deactivated. Triggers re-sync of team tuples.
 */
export const teamChangedEvent = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_CHANGED,
  basePayload.extend({ teamId: z.string().uuid() })
);

/**
 * Emitted when a user joins a team (teamId set on the User row). Triggers
 * re-sync of team member and employee.subject tuples.
 */
export const teamMemberAddedEvent = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_MEMBER_ADDED,
  basePayload.extend({ userId: z.string().uuid(), teamId: z.string().uuid() })
);

/**
 * Emitted when a user leaves a team (teamId cleared or changed). Triggers
 * re-sync to remove old team member / employee.subject tuples.
 */
export const teamMemberRemovedEvent = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_MEMBER_REMOVED,
  basePayload.extend({ userId: z.string().uuid(), teamId: z.string().uuid() })
);

/**
 * Emitted when an employee transfer is approved (status → ACTIVE). Triggers
 * fast-lane revoke + re-sync of affected employee tuples.
 * Revokes get the fast lane — a synchronous best-effort revoke is attempted in
 * the approveTransfer path; this event is the reliability guarantee.
 */
export const employeeTransferredEvent = defineEvent(
  ORG_GRAPH_EVENTS.EMPLOYEE_TRANSFERRED,
  basePayload.extend({ userId: z.string().uuid(), transferId: z.string().uuid() })
);

/**
 * Emitted when a delegation is created (ApprovalDelegation row inserted).
 * Triggers re-sync to add the conditioned `delegate` tuple on the team.
 */
export const delegationCreatedEvent = defineEvent(
  ORG_GRAPH_EVENTS.DELEGATION_CREATED,
  basePayload.extend({ delegationId: z.string().uuid(), teamId: z.string().uuid().nullable() })
);

/**
 * Emitted when a delegation is revoked (ApprovalDelegation row deleted).
 * Triggers re-sync to remove the conditioned `delegate` tuple on the team.
 */
export const delegationRevokedEvent = defineEvent(
  ORG_GRAPH_EVENTS.DELEGATION_REVOKED,
  basePayload.extend({ delegationId: z.string().uuid() })
);

// ── Convenience catalog ───────────────────────────────────────────────────────

/** All org-graph event definitions, ordered as in ORG_GRAPH_EVENTS. */
export const ORG_GRAPH_EVENT_DEFS = [
  orgCreatedEvent,
  orgRoleChangedEvent,
  businessUnitChangedEvent,
  departmentChangedEvent,
  teamChangedEvent,
  teamMemberAddedEvent,
  teamMemberRemovedEvent,
  employeeTransferredEvent,
  delegationCreatedEvent,
  delegationRevokedEvent,
] as const;
