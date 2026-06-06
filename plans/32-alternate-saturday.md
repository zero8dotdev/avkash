# Plan 32 — Alternate Saturday workweek pattern

Status: **implementation plan**. Extends workweek modelling from a static day-array to a
bi-weekly rotating pattern. Required for executives who have alternating Saturdays off.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Independent of other plans.

---

## The limitation

`Team.workweek` and `User.workweek` are `days_of_week[]` — a fixed set of working days that repeats
every week. "Every other Saturday is off" cannot be expressed here: Saturday is either always in or
always out. Getting it wrong means leave working-day calculations are off by 0.5 days/month for all
executive employees.

---

## Design: `WorkweekPattern` entity

A `WorkweekPattern` defines a cycle of N weeks, each week having its own day-set. For alternate
Saturdays, N=2: Week A = Mon–Sat, Week B = Mon–Fri.

The pattern anchors to a `referenceDate` (any Monday in the past). A pure resolver determines, for
any given date, which week in the cycle it falls into, and returns the correct day-set.

```
effectiveWorkdays(pattern, date):
  weeksSinceReference = floor((date - referenceDate) / 7)
  cycleIndex = weeksSinceReference mod pattern.cycleLength
  return pattern.weeks[cycleIndex]
```

This is pure, O(1), no DB read at resolution time once the pattern is loaded.

---

## Schema

**`schema/workweek-pattern.ts`** (new, owned by `@avkash/org`):

```
workweek_pattern
  id             uuid PK
  orgId          uuid FK
  name           varchar        (e.g. "Alternate Saturday — Executives")
  cycleLength    integer        (2 for fortnightly, 4 for monthly cycle)
  weeks          jsonb          (days_of_week[][]; length = cycleLength)
  referenceDate  date           (anchor Monday; determines cycle phase)
  isActive       bool           default true
  version        integer        default 0
  createdAt / updatedAt / createdBy / updatedBy
  unique(orgId, name)
```

**`team` additions**:
```
workweekPatternId   uuid? FK → workweek_pattern   (overrides static workweek when set)
```

**`user` additions**:
```
workweekPatternId   uuid? FK → workweek_pattern   (per-user override; overrides team pattern)
```

Precedence chain (mirrors the existing workweek cascade):
`user.workweekPatternId → team.workweekPatternId → user.workweek → team.workweek → org default`

When a pattern is in effect, the static `workweek` array is ignored.

---

## Domain (`@avkash/org`)

`org/workweek-patterns.ts`:

- `createWorkweekPattern(ctx, input)` — ADMIN; validates `weeks.length === cycleLength`,
  `referenceDate` is a Monday.
- `listWorkweekPatterns(ctx)` — MANAGER+.
- `updateWorkweekPattern(ctx, id, patch, version?)` — ADMIN; concurrency.
- `archiveWorkweekPattern(ctx, id)` — ADMIN; soft-delete.

Pure helper (exported, tested):

- `effectiveWorkdays(pattern: WorkweekPattern, date: Date): DaysOfWeek[]` — returns the day-set
  for the week containing `date`.
- `isWorkday(pattern: WorkweekPattern, date: Date): boolean` — shortcut.

---

## Impact on `calculateWorkingDays`

`packages/leave/src/working-days.ts` currently takes a `workweek: DaysOfWeek[]`. The signature must
be extended to accept a pattern:

```ts
function calculateWorkingDays(
  workweek: DaysOfWeek[] | WorkweekPattern,
  holidays: Holiday[],
  startDate: string,
  endDate: string,
  duration: LeaveDuration
): number
```

When a `WorkweekPattern` is passed:
- Iterate each date in the range.
- For each date, call `isWorkday(pattern, date)`.
- If false, skip; if true, count (full or half per `duration`).

The existing array-based path remains unchanged (a plain array still works as a fixed pattern).

`computeWorkingDays` (the DB wrapper in `@avkash/leave`) resolves the pattern via:
`user.workweekPatternId → team.workweekPatternId → user.workweek → team.workweek`.

---

## Impact on attendance resolver

`resolveDay` checks `WEEKLY_OFF` by testing whether the date's day-of-week is in the user's
workweek. Same extension: resolve pattern first; if pattern, call `isWorkday(pattern, date)`.

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/workweek-patterns` | ADMIN | idempotency |
| GET | `/workweek-patterns` | MANAGER | |
| GET | `/workweek-patterns/:id` | MANAGER | ETag |
| PATCH | `/workweek-patterns/:id` | ADMIN | If-Match |
| DELETE | `/workweek-patterns/:id` | ADMIN | soft-archive |
| PATCH | `/teams/:id` | ADMIN | gains `workweekPatternId` field |
| PATCH | `/employees/:userId` | ADMIN | gains `workweekPatternId` field |

---

## Seeding for this org

On setup, create one pattern:

```json
{
  "name": "Alternate Saturday Off",
  "cycleLength": 2,
  "referenceDate": "<nearest past Monday>",
  "weeks": [
    ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],
    ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]
  ]
}
```

Assign it to all executive-level teams (or override per-team as needed).

---

## Tests

- `effectiveWorkdays(pattern, date)` returns Week A for dates in odd cycles, Week B for even.
- `isWorkday(pattern, saturday-in-week-A)` → true.
- `isWorkday(pattern, saturday-in-week-B)` → false.
- `calculateWorkingDays` with a pattern counts alternating Saturdays correctly over a month.
- Pattern with referenceDate not a Monday → `ValidationError`.
- `weeks.length !== cycleLength` → `ValidationError`.

---

## Build order

1. Schema (`workweek_pattern`, FKs on `team` + `user`). `db:push`.
2. Pure helpers (`effectiveWorkdays`, `isWorkday`). Tests first.
3. Domain CRUD in `org/workweek-patterns.ts`.
4. Extend `calculateWorkingDays` + `computeWorkingDays`.
5. Extend attendance resolver (`resolveDay` WEEKLY_OFF check).
6. Routes + DTOs.
