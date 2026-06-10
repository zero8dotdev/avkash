# Plan 49 Phase 1 — Event bus: implementation report

**Branch:** `plan51/phase1-events`
**Status:** complete — all gates pass

---

## Files touched

| File | Change |
|---|---|
| `packages/db/src/schema/event-outbox.ts` | New — `EventOutbox` table definition |
| `packages/db/src/schema/index.ts` | +1 line: `export * from './event-outbox'` |
| `packages/db/src/schema/types.ts` | Added `EventOutbox` / `NewEventOutbox` row types |
| `packages/events/package.json` | New package `@avkash/events` |
| `packages/events/tsconfig.json` | Extends `@avkash/tsconfig/base.json` |
| `packages/events/src/define.ts` | `defineEvent<P>(name, schema)` |
| `packages/events/src/publish.ts` | `publish()` + `publishWithRequestId()` |
| `packages/events/src/registry.ts` | In-process subscriber registry (`subscribe`, `wireSubscribers`, `_resetRegistryForTest`) |
| `packages/events/src/relay.ts` | `runRelayOnce()`, `startRelay()` |
| `packages/events/src/observability.ts` | `outboxDepth()`, `oldestUnpublishedAgeMs()` |
| `packages/events/src/index.ts` | Public barrel |
| `packages/events/src/events.test.ts` | Integration tests (real-Postgres) |
| `apps/worker/src/index.ts` | Wire `startRelay()` alongside BullMQ worker |
| `apps/worker/package.json` | Add `@avkash/events` dependency |
| `packages/attendance/src/attendance.ts` | Fix pre-existing `prefer-const` lint error (`let` → `const`) |

---

## Interface deviations from the plan

### `publish()` signature

Plan 49 Seam 1 shows:
```ts
publish<P>(tx, ctx, def: EventDef<P>, payload: P): Promise<void>
```
Implemented exactly as specified. An additional `publishWithRequestId()` overload is exported for HTTP
handlers that have a correlation id; it is additive and does not replace the primary API.

### `requestId` column

The plan schema shows `requestId varchar?`. The `publish()` function always stores `null` (the caller's
`AuthContext` does not carry a `requestId` field). `publishWithRequestId()` accepts an explicit
`string | null`. This is a deliberate choice: HTTP handlers may pass `c.get('requestId')`; background jobs
and domain functions that have no request-id boundary call the base `publish()`.

### Relay — no LISTEN/NOTIFY

Per-spec: "Poll-based only — skip LISTEN/NOTIFY for now, note it as TODO." The `startRelay()` loop polls
every `intervalMs` (default 5 s). The TODO is noted as a comment in `relay.ts`.

### `wireSubscribers()` helper

Not in the Plan 49 spec but required by Plan 49 Seam 2 (module registry) which calls
`registry.wireSubscribers(module.subscribers)` at boot. Added as an additive export — does not change the
primary `subscribe()` API.

### `_resetRegistryForTest()` export

Test-only reset of the in-process singleton. Conventionally named with a leading underscore per the
codebase's pattern for internal/test utilities.

---

## Test evidence

Tests live in `packages/events/src/events.test.ts`. They require `DATABASE_URL` pointing at a running
Postgres (same as `db:push` uses).

**Run command:**
```bash
bun test packages/events/src/events.test.ts
```

**Test environment note:** The Postgres instance is not available in the CI/build environment used for this
implementation (no `docker compose up` was run per the task constraints). The tests were **written** and
**typecheck** cleanly, but were **not executed** against a live database during this session.

Test coverage summary:

| Suite | Test | Outcome |
|---|---|---|
| `publish()` — transactional outbox | inserts row inside tx | written, not executed |
| `publish()` | rolls back with surrounding tx | written, not executed |
| `publish()` | rejects invalid payloads (Zod) | written, not executed |
| `runRelayOnce()` — relay drain | marks publishedAt with no subscribers | written, not executed |
| `runRelayOnce()` | calls registered subscriber | written, not executed |
| `runRelayOnce()` | increments attempts + sets lastError on subscriber throw | written, not executed |
| Idempotent redelivery | second relay pass is a no-op for published rows | written, not executed |
| Observability | `outboxDepth()` counts unpublished rows | written, not executed |
| Observability | `oldestUnpublishedAgeMs()` returns 0 when none pending | written, not executed |
| Observability | `oldestUnpublishedAgeMs()` returns positive age | written, not executed |

The `cleanupOrg()` helper in `apps/api/src/test/helpers.ts` does **not** yet include
`schema.eventOutbox` — when Phase 2 (domain packages calling `publish()`) lands and scenario tests start
publishing events, a one-line addition to that helper will be needed:
```ts
await db.delete(schema.eventOutbox).where(eq(schema.eventOutbox.orgId, orgId));
```

---

## Gate outcomes

```
pnpm install    ✓  24 workspace projects resolved, @avkash/events wired
pnpm typecheck  ✓  21 packages — 21 successful, 0 errors
pnpm lint       ✓  21 packages — 21 successful, 0 errors
```

---

## Open issues / follow-on

1. **LISTEN/NOTIFY** — add Postgres `LISTEN 'event_outbox_insert'` in the relay loop for sub-second
   latency; the `pg_notify()` call goes in a DB trigger or inside `publish()` via a raw SQL statement after
   insert. Currently the relay polls every 5 s.
2. **Cleanup helper** — `cleanupOrg()` in scenario test helpers should delete `eventOutbox` rows; add
   when Phase 2 domain packages start publishing.
3. **Worker concurrency** — the relay currently processes rows sequentially per pass. A future improvement
   would claim rows with a `FOR UPDATE SKIP LOCKED` pattern to allow safe concurrent relay instances.
4. **Dead-letter surface** — rows with `attempts >= MAX_ATTEMPTS` are counted as `skipped` in relay
   metrics but left in the table indefinitely. A triage endpoint or periodic DLQ sweep should be added.
5. **Phase 2 migration** — once this seam is merged, Phase 2 can start replacing direct `dispatch()` calls
   in leave/attendance/users/org with `publish()`, moving `@avkash/notifications` to be an event
   subscriber. That removes the current layer violation.
