# Interview Prep — Backend Resilience & Distributed Systems (via Avkash)

Concepts you've actually shipped in Avkash's "Activate" path (scheduled accruals →
notifications), framed for interviews. Each section: **the concept**, **how it shows
up in Avkash** (with files), and a likely **follow-up Q&A**.

> Status: Phases 1–3b are implemented. Phase 3c (retries / DLQ / reconciliation
> sweep) is the resilience layer being added — noted inline where relevant.

The one-breath summary to anchor everything:

> _"It's an outbox-based notification pipeline: domain events write intents
> transactionally, a worker delivers them at-least-once with retries and exponential
> backoff, idempotency keys at both the outbox and the provider make it
> effectively-once, transient failures retry on a reconciliation sweep, and permanent
> ones dead-letter for inspection."_

---

## 1. At-least-once delivery + idempotent consumers ("effectively-once")

**Concept.** Across a network you cannot get true exactly-once delivery. You get
**at-least-once** (a message may be delivered more than once because of retries) and
make it _safe_ by ensuring the consumer is **idempotent** (processing the same
message twice has the same effect as once). The combination is often called
"effectively-once."

**In Avkash.** The daily accrual cron can fire twice, a job can retry, the notify
step can re-run — all at-least-once. Safety comes from two idempotent gates:

- The ledger has a unique `(userId, leaveTypeId, periodKey)` and
  `onConflictDoNothing` — a re-credit is a no-op (`packages/leave/src/accrual.ts`).
- The notification outbox has a unique `dedupeKey` — a re-notify is a no-op
  (`packages/db/src/schema/notification.ts`, `packages/notifications/src/dispatch.ts`).

**Follow-up Q&A.**

- _"Why not exactly-once?"_ — Because the ack of "I processed this" can itself be lost;
  the producer then can't tell "done" from "never happened" and must resend. So you
  design for duplicates instead of trying to eliminate them.
- _"What makes a consumer idempotent here?"_ — A natural idempotency key derived from
  the business event (the period + user + type), enforced by a DB unique constraint —
  not application-level "check then insert" (which races).

---

## 2. The Transactional Outbox pattern

**Concept.** When you must both change state _and_ tell the outside world (send an
email, publish an event), you can't do both atomically across two systems (DB +
email API). The outbox pattern writes the side-effect _intent_ as a row in the same
database transaction as the state change, then a separate process delivers it. No
lost messages, no "sent the email but the DB rolled back."

**In Avkash.** The `Notification` table is the outbox. The domain produces credits;
`notifyAccrualCredits` turns them into intents; `dispatch` writes an outbox row
**then** calls the provider and records the result
(`packages/notifications/src/dispatch.ts`). The row is the durable source of truth —
delivery is a separate, retryable step.

**Follow-up Q&A.**

- _"Why not just call the email API inside the request?"_ — It couples request latency
  to a third party, and a provider blip loses the notification. The outbox decouples
  "decide to notify" (transactional, fast) from "deliver" (async, retryable).
- _"How does the deliverer find new rows?"_ — Here a worker processes them in the same
  flow and a sweep re-checks `FAILED` rows (3c). At larger scale you'd use CDC /
  change-data-capture or a polling publisher.

---

## 3. Idempotency keys (request + provider)

**Concept.** An idempotency key lets a caller safely retry an unsafe operation: the
server recognizes the key and returns the original result instead of doing the work
again. Critical for POSTs over flaky networks and for AI/agent callers that retry.

**In Avkash, three layers.**

- HTTP: the `idempotency` middleware + `IdempotencyKey` table fingerprint a request
  and replay the cached response (`apps/api/src/middleware/idempotency.ts`).
- Outbox: the per-channel `dedupeKey` prevents a second send.
- Provider: Resend gets that same key as its `Idempotency-Key` header, so the
  _provider_ also dedupes (`packages/notifications/src/providers.ts`).

**Follow-up Q&A.**

- _"What does the key cover — just the key string?"_ — We fingerprint method + path +
  body (a hash), so the same key with a _different_ body is rejected rather than
  silently replaying a stale response.
- _"How long do you keep keys?"_ — As long as the retry window you promise; older keys
  expire. There's a storage-vs-safety tradeoff.

---

## 4. Retry with exponential backoff + jitter

**Concept.** Retries recover from transient failures, but naive retries make things
worse: many clients retrying at the same interval create a **retry storm / thundering
herd** that keeps a recovering service down. Fixes: **exponential backoff** (wait
1s, 2s, 4s, …) and **jitter** (randomize the delay) so retries decorrelate.

**In Avkash (3c).** BullMQ job options `attempts` + `backoff: { type: 'exponential' }`
on the scheduled jobs (`packages/jobs/src/queue.ts`); the notification sweep backs off
per-row using the `attempts` count.

**Follow-up Q&A.**

- _"Why jitter?"_ — Without it, N clients that failed together retry together, re-spiking
  load at each backoff step. Jitter spreads them out.
- _"Cap on retries?"_ — Yes — a retry _budget_. After it, the message dead-letters
  (§6) rather than retrying forever.

---

## 5. Transient vs permanent failure classification

**Concept.** Not every failure should be retried. **Transient** (429 rate-limit, 503,
network timeout) → retry. **Permanent** (422 invalid email, 400 bad request) → never
succeeds, so retrying wastes the budget and delays giving up. You classify on the
error and branch.

**In Avkash (3c).** The provider `send` throws with the HTTP status
(`packages/notifications/src/providers.ts` already throws `resend <status>: …`); the
dispatcher/sweep classifies: transient → keep `FAILED` (retryable), permanent → mark
`DEAD` (give up).

**Follow-up Q&A.**

- _"How do you decide which is which?"_ — Primarily HTTP status class; 429/5xx/network
  = transient, 4xx-validation = permanent. When unsure, treat as transient but cap
  attempts so it still dead-letters.
- _"What about a 429 specifically?"_ — Respect `Retry-After` if present — that's the
  server telling you the backoff.

---

## 6. Dead-letter queue & poison messages

**Concept.** A **poison message** is one that can never be processed successfully.
Left alone it either loops forever (burning resources) or gets silently dropped
(data loss). A **dead-letter queue** (DLQ) parks it after the retry budget for human
inspection/replay — failure isolation so one bad message doesn't block the queue.

**In Avkash (3c).** Two levels: BullMQ's failed set (with retention) is the job-level
DLQ; a `DEAD` notification status is the message-level dead-letter, queryable for an
ops dashboard.

**Follow-up Q&A.**

- _"What do you do with the DLQ?"_ — Alert on it, inspect the `error`, fix the cause
  (bad template, unverified domain), then replay. It's a queue you _want_ to be empty.
- _"Difference between FAILED and DEAD here?"_ — `FAILED` = transient, will be retried by
  the sweep; `DEAD` = gave up (permanent or budget exhausted), won't be retried.

---

## 7. Reconciliation / the "janitor" pattern

**Concept.** A periodic job that scans for stuck or inconsistent state and repairs
it. The backbone of **eventual consistency** — instead of guaranteeing every step
inline, you let a sweeper converge the system. Ubiquitous in payments/fintech.

**In Avkash (3c).** `retryFailedNotifications()` — a scheduled sweep
(`packages/jobs/src/schedule.ts`) that finds `FAILED` outbox rows within their attempt
budget and re-dispatches them. The same daily tick is itself reconciling: re-running
a missed day credits exactly the rows that weren't posted.

**Follow-up Q&A.**

- _"Isn't a sweep wasteful vs. event-driven?"_ — It's the safety net, not the primary
  path. Most delivery happens inline; the sweep only touches the small set that
  failed. Cheap because it's filtered by status + index.
- _"How do you avoid the sweep and a retry racing?"_ — The outbox dedupe + attempt
  bookkeeping; a CAS on `attempts`/status so two workers don't double-send.

---

## 8. Backpressure & rate limiting (→ circuit breakers)

**Concept.** A fast producer can overwhelm a slow downstream. **Backpressure** slows
the producer to match the consumer; **rate limiting** caps calls to respect a
provider's limits. If a dependency is _down_, a **circuit breaker** stops calling it
entirely for a cooldown instead of piling up failures.

**In Avkash.** BullMQ worker `concurrency` (`packages/jobs/src/worker.ts`) bounds how
many jobs run at once; a worker `limiter` (3c) caps provider calls/sec to honor
Resend/MSG91 rate limits. Circuit breaker is the natural "what I'd add next."

**Follow-up Q&A.**

- _"Where's the queue's backpressure?"_ — The queue _is_ the buffer; concurrency + rate
  limiter control drain rate. If producers outrun consumers, depth grows (a signal to
  scale workers), not a crash.
- _"When a provider is down for an hour?"_ — Circuit-break to stop wasting attempts,
  let the outbox accumulate, drain when it recovers — the outbox makes this safe.

---

## 9. Scheduling: a daily tick vs per-entity repeatable jobs

**Concept.** Two ways to run recurring per-entity work: (a) one **tick** that scans
and decides who's due today, or (b) a **repeatable job per entity**. The tick is
simpler to reason about, handles entities that change at runtime, and the same "is it
due?" function answers "when's next?" for free.

**In Avkash.** A pure timing function `accrualOccursOn(policy, date)` drives a daily
cron, and `nextAccrualOn(policy, from)` drives the HR dashboard — one source of truth
(`packages/leave/src/accrual-schedule.ts`). Scheduled via a BullMQ repeatable job
(`packages/jobs/src/schedule.ts`). Every scheduled job is idempotent, so a missed or
double fire is safe.

**Follow-up Q&A.**

- _"Why a tick over per-policy cron jobs?"_ — Policies change at runtime; with per-entity
  jobs you'd constantly add/remove schedules and risk drift. The tick reads current
  state each day. Bonus: the same function powers "next credit" on the dashboard.
- _"What if the worker is down at 1am?"_ — The next run reconciles: the ledger's period
  key means only the un-posted credits get posted. No double credit, no missed credit.

---

## 10. Observability of async work

**Concept.** Async/queue systems are opaque unless you instrument them. You want job
states (waiting/active/completed/failed/delayed), throughput, failure rate, queue
depth, and the ability to _replay_ a specific failure.

**In Avkash.** BullMQ exposes job states and a failed set; the `Notification` outbox is
a durable audit trail (status, attempts, error, timestamps) — you can answer "did
user X get notified, on what channel, when, and if not why" from one table.

**Follow-up Q&A.**

- _"How do you know the queue is healthy?"_ — Queue depth + failed-rate + oldest-waiting
  age. Rising depth = consumers behind; rising DEAD = a systemic provider/template bug.
- _"How do you replay one failure?"_ — Find the outbox row, reset it to retryable, the
  sweep re-dispatches; the dedupe key means a replay can't double-send.

---

## 11. (Already built) Optimistic concurrency control

**Concept.** Two clients editing the same record can clobber each other ("lost
update"). **Optimistic** concurrency assumes conflicts are rare: each record carries a
`version`; an update succeeds only if the version still matches, else the client must
refetch and retry. No locks held across a user's think-time.

**In Avkash.** Mutable resources carry a `version`; GET returns it as an `ETag`, PATCH
**requires** `If-Match` (428 if missing, 412 if stale), and the UPDATE does a
compare-and-set on `version` (`apps/api/src/concurrency.ts`).

**Follow-up Q&A.**

- _"Optimistic vs pessimistic?"_ — Pessimistic locks the row (safe but holds locks, hurts
  concurrency, risks deadlock); optimistic is lock-free and great when conflicts are
  rare, at the cost of occasional retry. HTTP is stateless, so optimistic + ETags fits.
- _"Why 428 and 412?"_ — 428 Precondition Required = you forgot `If-Match` (forces safe
  updates); 412 Precondition Failed = your version is stale (someone edited first).

---

## 12. (Already built) Graceful degradation via a provider seam

**Concept.** Depend on an _interface_, choose the _implementation_ at boot from config
(the adapter/strategy pattern). The system runs fully in dev with a no-op/console
provider and goes live by setting env — no code branches at call sites.

**In Avkash.** `EmailProvider`/`SmsProvider` interfaces with console + Resend + MSG91
implementations, selected from env keys (`packages/notifications/src/providers.ts`).
Absent keys → console fallback. SMS is only _selected_ when a real provider is
configured, so we never promise a channel we can't deliver.

**Follow-up Q&A.**

- _"Why not just call Resend directly?"_ — Testability (no external calls in dev/CI),
  swappability (change providers in one file), and graceful degradation. The blast
  radius of swapping a provider is one module.
- _"How do callers stay unaware?"_ — They call `sendEmail`/`sendSMS`; selection happens
  once at boot. That seam is why adding Resend touched zero callers.

---

## Cheat-sheet (rapid recall)

| Concept                             | Avkash anchor                                       |
| ----------------------------------- | --------------------------------------------------- |
| At-least-once + idempotent consumer | ledger `periodKey` + outbox `dedupeKey`             |
| Transactional outbox                | `Notification` table + `dispatch`                   |
| Idempotency keys                    | `idempotency` middleware + Resend `Idempotency-Key` |
| Exponential backoff + jitter        | BullMQ `backoff` (3c)                               |
| Transient vs permanent              | provider throws status → `FAILED` vs `DEAD` (3c)    |
| Dead-letter / poison message        | BullMQ failed set + `DEAD` status (3c)              |
| Reconciliation / janitor            | `retryFailedNotifications` sweep (3c)               |
| Backpressure / rate limit           | worker `concurrency` + `limiter`                    |
| Tick vs per-entity schedule         | `accrualOccursOn` / `nextAccrualOn`                 |
| Optimistic concurrency              | `version` + ETag + `If-Match` (428/412)             |
| Adapter / graceful degradation      | provider seam in `providers.ts`                     |
