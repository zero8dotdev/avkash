# Plan 45 — Shift-aware half-day leave

Status: **implementation plan**. Makes half-day leave semantics relative to the employee's assigned
shift instead of a fixed clock-based "morning" or "afternoon" split that is meaningless for rotating
shift workers.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level — affects WORKERs specifically).

---

## The gap

`Leave.shift` (enum: `MORNING | AFTERNOON | NONE`) was designed for a standard office day where
"morning half" = before lunch and "afternoon half" = after lunch. For a worker on the Night Shift
(22:00–06:00), "MORNING half-day" is nonsensical — the shift starts at 10 PM.

The working-day calculation already treats any half-day as 0.5 days regardless of the shift sub-
field, so the *count* is correct. The problem is:
1. The resolver uses `Leave.shift` to determine which punches to treat as "half day present" vs
   "half day absent" — it compares clock time against `MORNING`/`AFTERNOON` boundaries, not shift
   boundaries.
2. The UI presents "Morning half / Afternoon half" to a night-shift worker, which is confusing.
3. Payroll needs to know *which half of their shift* was absent, not which clock half of the day.

---

## Design: rename semantics to `FIRST_HALF | SECOND_HALF | NONE`

### Enum rename

The Postgres enum `shift` (`MORNING | AFTERNOON | NONE`) is renamed to `half_day_part`
(`FIRST_HALF | SECOND_HALF | NONE`).

Existing `Leave.shift` column is renamed to `Leave.halfDayPart` using a schema migration:
- Postgres: `ALTER TYPE shift RENAME VALUE 'MORNING' TO 'FIRST_HALF'` etc., or drop and recreate.
- Since `db:push` is used (no migration files), this is a column + enum redefinition in the schema
  source followed by `db:push`. Existing MORNING data maps to FIRST_HALF, AFTERNOON to SECOND_HALF.
- A one-off Bun script converts existing rows before `db:push`.

### Interpretation

For leave overlap detection and the resolver:

```ts
function halfDayWindow(shift: Shift, part: HalfDayPart): { from: HH:MM, to: HH:MM }
```

```
FIRST_HALF  → from: shift.startTime, to: midpoint(shift.startTime, shift.endTime)
SECOND_HALF → from: midpoint(shift.startTime, shift.endTime), to: shift.endTime
NONE        → full shift
```

`midpoint` is calculated in minutes-since-midnight (crossing midnight handled via
`crossesMidnight`). This is a pure function that replaces the hardcoded MORNING = before 13:00,
AFTERNOON = after 13:00 logic.

For EXECUTIVE employees on a fixed 10:30–18:30 shift:
- FIRST_HALF → 10:30–14:30
- SECOND_HALF → 14:30–18:30

For a WORKER on Morning shift (06:00–14:00):
- FIRST_HALF → 06:00–10:00
- SECOND_HALF → 10:00–14:00

The working-day count (0.5 days) is unchanged. Only the time window changes.

---

## Schema changes

`packages/db/src/schema/leave.ts`:

```
-- Old:
shift   shift_enum   default 'NONE'

-- New:
halfDayPart   half_day_part   default 'NONE'
```

`packages/db/src/schema/enums.ts`:

```
-- Remove: shift (MORNING | AFTERNOON | NONE)
-- Add: half_day_part (FIRST_HALF | SECOND_HALF | NONE)
```

---

## Data migration (one-off Bun script)

```ts
// db/scripts/migrate-half-day-part.ts
await db.execute(sql`
  UPDATE leave
  SET half_day_part = CASE
    WHEN shift = 'MORNING'   THEN 'FIRST_HALF'
    WHEN shift = 'AFTERNOON' THEN 'SECOND_HALF'
    ELSE 'NONE'
  END
  WHERE duration = 'HALF_DAY'
`)
```

Run before `db:push` that drops the old enum. Safe to run multiple times (idempotent via CASE).

---

## Resolver change

`packages/attendance/src/resolver.ts` — in the half-day overlap check (which half of the day is
on leave vs present):

Replace:
```ts
const morningBoundary = parseHHMM('13:00')
if (halfDayPart === 'FIRST_HALF' && firstInHHMM < morningBoundary) → HALF_DAY_FIRST
```

With:
```ts
const { from, to } = halfDayWindow(shift, leave.halfDayPart)
// Punches within [from, to] → present for that half; outside → absent for that half
```

---

## Leave application API

`applyLeave` input schema (`POST /leave`):
- Rename `shift` field to `halfDayPart` (or accept both names with a deprecation alias for one
  version).
- Values: `'FIRST_HALF' | 'SECOND_HALF' | 'NONE'` (the old MORNING/AFTERNOON are rejected — a
  clear API break, version-bumped in the route if needed).

---

## UI impact

The leave application form shows "First half of shift" / "Second half of shift" instead of "Morning"
/ "Afternoon" — the backend change forces the frontend to adopt the new labels.

---

## Tests

- `halfDayWindow(morningShift, 'FIRST_HALF')` → `{ from: '06:00', to: '10:00' }`.
- `halfDayWindow(nightShift, 'SECOND_HALF')` → crosses midnight correctly.
- `halfDayWindow(generalShift, 'FIRST_HALF')` → `{ from: '10:30', to: '14:30' }`.
- `resolveDay` with `halfDayPart = 'FIRST_HALF'` marks the first half of the shift as ON_LEAVE
  and the second half as worked (if punches exist for it).
- Migration script converts MORNING → FIRST_HALF for all existing HALF_DAY leaves.

---

## Build order

1. One-off migration script. Run against dev DB. Verify row counts.
2. Remove old `shift` enum; add `half_day_part` enum. Rename column in schema. `db:push`.
3. Add `halfDayWindow` pure function. Tests.
4. Update `resolveDay` overlap/half-day logic.
5. Update `applyLeave` input Zod schema.
6. Tests (full suite — this touches the leave + attendance hot paths).
