# Plan 20 — Activate: scheduled accruals + notifications

Turn the built-but-dormant engine into a living system: accruals fire on a real
schedule, balances credit safely, users get notified, and HR/Admin can see what's
coming. Done across multiple processes (phases), each independently shippable.

## Core idea — one timing function is the spine

Replace the blunt `runAccruals('MONTHLY')` (credit-everything-now) with a daily
**tick** driven by a pure timing function:

- `accrualOccursOn(policy, date) -> boolean` — drives the cron ("is today a credit day?")
- `nextAccrualOn(policy, fromDate) -> Date` — drives the dashboard ("when's the next one?")

Same logic answers both, so cron and dashboard can never disagree. Pure date math
→ fully unit-testable.

Cadence comes from two **already-existing** policy fields (no migration):

- `accrualFrequency`: MONTHLY | QUARTERLY
- `accrueOn`: BEGINNING | END — start/end of the period (defaults to BEGINNING when null)

→ start-of-month, end-of-month, start-of-quarter, end-of-quarter.

## Safety (idempotency)

| Layer                                                                         | Guarantees                     | Status           |
| ----------------------------------------------------------------------------- | ------------------------------ | ---------------- |
| `leaveLedger` unique `(userId, leaveTypeId, periodKey)` + onConflictDoNothing | no double-credit, ever         | exists           |
| `/internal` token on the tick                                                 | only the scheduler can trigger | exists           |
| `Idempotency-Key: accrual-tick:{date}`                                        | clean retry (replays response) | reuse middleware |
| `Notification` outbox unique dedupe key                                       | notify-once on retried ticks   | phase 2          |

A half-failed tick is resumable: posted credits conflict-skip, the rest post.
`periodKey` (`accrual:2026-06`, `accrual:2026-Q2`) identifies the period; the anchor
only changes which day it fires, not the period identity.

## Notifications — who / channel / template / send

`notifications` stays provider-only. Routing sits above it as an outbox + dispatcher:

1. Domain emits an event with **pre-resolved recipients + payload** (leave knows who
   got credited; it hands notifications the data, never the reverse).
2. Dispatcher resolves per recipient: **channel** (preference) → **template**
   (event × channel) → **provider**.
3. `Notification` outbox row per send, with a **dedupe key** → notify-once + audit +
   dashboard data.

## Phases

- **Phase 1 — Schedule spine.** `accrualOccursOn` / `nextAccrualOn` over the existing
  `accrueOn` field (+ unit tests, first `bun test` in the repo); refactor to a daily
  `/internal/accrual-tick` returning per-user credit events; `GET /accruals/upcoming`
  (ADMIN+) for HR/Admin. No notifications yet.
- **Phase 2 — Notification spine.** `Notification` outbox; channel-preference +
  contact resolver; template registry; `dispatch()`; wire tick → `balance.credited`.
- **Phase 3 — Run unattended.** BullMQ repeatable job in `jobs` (Redis) hits the
  tick; swap provider stubs for Resend (email) / MSG91 (SMS); retries, backoff, DLQ.
- **Phase 4 (optional)** — Slack + in-app channels; richer dashboard.

## Decisions

- **Daily-tick over per-policy repeatable jobs** — policies change at runtime, gives
  `nextAccrualOn` for free, naturally idempotent/resumable.
- `accrueOn` null defaults to **BEGINNING** (credit on the 1st) — matches existing policies.
