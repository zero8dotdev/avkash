# Plan 35 — Floating manager / multi-location user

Status: **implementation plan**. Handles employees (floating managers, top management) who are
officially based at one location but routinely work across multiple factories without a formal
transfer for each visit.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 34 (transfer
management — provides the underlying effective-location infrastructure).

---

## Difference from a transfer

A **transfer** is a formal, HR-documented movement with a start/end date and a paper trail.

A **floating manager** or **top management** visit is informal:
- Plant head visits Factory 2 for two days to cover a process audit.
- CEO flies to Factory 4 for a board walkthrough.
- A floating HR manager covers Factory 1 and Factory 3 this week.

These do not warrant a PENDING → ACTIVE transfer lifecycle. What they need is:
- The ability to punch at any factory device without being flagged as "wrong location".
- A punch at Factory 2 logged under Factory 2 (not their home location) for that day's attendance.
- Their leave/holiday resolution still follows their _home_ location (their contract is there).

---

## Design: `isFloating` flag + punch-location resolution

### Flag on user

`packages/db/src/schema/user.ts` — add one column:

```
isFloating   bool   default false
```

**Access tier** (Plan 18 field-tier model): HR-write, MANAGER-read.

### Effect on punch ingestion

`ingestPunch` (Plan 23, Phase 2) already records `locationId` from the device that received the
punch. The existing allowed-window violation flag (`flagged = true`) is set when the user punches
outside their location's punch window.

For `isFloating = true` users:
- **Never flag as wrong-location** — a floating user at any factory is expected.
- **The punch's locationId is the device's location** (already the case).
- `resolveDay` uses the punch's `locationId` for that day's context (which shift window, which
  holidays) — this already follows from how `resolveDay` will use effective-location (Plan 34).

### Effect on leave / holiday resolution

Floating does **not** change which holiday calendar applies to leave calculation. Leave is resolved
against the user's home location (`user.locationId`), not the day-by-day punch location. This is
intentional: a floating manager's leave entitlement is governed by their home factory's state
holidays, not wherever they happened to be on any given day.

This distinction is critical: `effectiveLocation` (Plan 34) is used for **attendance** context;
`user.locationId` (home) is used for **leave** context.

---

## Top management handling

Top management (`employmentLevel = MANAGEMENT`, Plan 29) should be automatically treated as
floating. Two options:

1. Set `isFloating = true` when HR sets `employmentLevel = MANAGEMENT` (automatic, in domain logic).
2. Keep them separate (HR explicitly sets both).

**Decision: option 1** — when HR sets a user's level to MANAGEMENT, `isFloating` is automatically
set to `true` as a domain side-effect. This can be overridden (set back to false) manually. The
linkage is documented in the audit log.

---

## Punch without a device (top management WEB punches)

When top management punches via WEB (Plan 31 allows this), there is no device to infer a location
from. The user must supply a `locationId` in the punch request:

```json
POST /attendance/punch
{
  "type": "IN",
  "source": "WEB",
  "locationId": "<factory-uuid>",   ← required for isFloating users on WEB source
  "ts": "2026-06-06T09:15:00+05:30"
}
```

`ingestPunch` validates: if `source === 'WEB'` and `user.isFloating === true`, `locationId` is
**required** (ValidationError if absent). For non-floating WEB users, `locationId` is optional
(defaults to `user.locationId`).

---

## Weekly-off / shift resolution for floating users

On any given day, a floating user may be at a different factory with a different workweek (e.g.,
Factory 3 has a different weekly-off pattern). For attendance purposes:

- The shift for the day is resolved from `ShiftAssignment` as usual.
- The weekly-off check uses `user.workweek` (home). Floating users don't inherit the visited
  factory's workweek — their contract determines their working days.

---

## API surface

No new routes needed. Extensions to existing:

- `PATCH /employees/:userId` (ADMIN) — gains `isFloating` as a patchable HR-write field.
- `POST /attendance/punch` — gains required `locationId` for floating WEB punches (validated in
  `ingestPunch`).

---

## Tests

- Punch from a floating user at a non-home location is accepted without `flagged = true`.
- Punch from a non-floating user at a non-home location is flagged.
- WEB punch from a floating MANAGEMENT user without `locationId` → `ValidationError`.
- WEB punch from a floating MANAGEMENT user with `locationId` → accepted; punch.locationId = provided.
- Setting `employmentLevel = MANAGEMENT` automatically sets `isFloating = true`.
- Leave working-day calculation for a floating user uses home location's holiday calendar, not
  the punch-day location's.

---

## Build order

1. Add `isFloating bool` to `user`. `db:push`.
2. Add auto-set logic in `updateEmployeeProfile` when level = MANAGEMENT.
3. Modify `ingestPunch`: skip wrong-location flag for `isFloating` users; require `locationId` on
   WEB punch for floating users.
4. Tests.
