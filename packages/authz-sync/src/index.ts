// @avkash/authz-sync — Tuple-sync pipeline.
//
// Orchestration layer: bridges Postgres org graph ↔ OpenFGA.
// Sits at the top of the dependency graph (orchestration tier).
// Reaches through domain reads (via @avkash/db) but owns no tables.
//
// Architecture:
//   - deriveExpectedTuples(orgId) — the single source of truth:
//       read current org graph from Postgres → produce expected FGA tuple set
//   - syncOrgTuples(orgId)        — state-based writer:
//       derive expected, read actual, diff, writeTuples(missing, extra)
//   - tupleWriterSubscribers      — event subscriber array (one per ORG_GRAPH_EVENTS):
//       wire into relay via wireSubscribers(tupleWriterSubscribers)
//   - reconcileAllOrgs()          — nightly reconciler:
//       syncOrgTuples for every org, count repairs, log loudly
//   - runBackfill()               — bootstrap / DR:
//       same code path as reconciler; run via pnpm authz:backfill
//   - ORG_GRAPH_EVENT_DEFS        — Zod-typed EventDef array for publish() calls
//
// Event payload conventions:
//   - All payloads carry {orgId} + entity ids only (state-based writer ignores rest).
//   - defineEvent() from @avkash/events; publish() inside domain transactions.

export { deriveExpectedTuples } from './derive';
export { syncOrgTuples, reconcileAllOrgs, diffTuples } from './sync';
export type { SyncResult, ReconcileSummary } from './sync';
export { tupleWriterSubscribers } from './subscriber';
export { runBackfill } from './backfill';
export {
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
  ORG_GRAPH_EVENT_DEFS,
} from './events';
