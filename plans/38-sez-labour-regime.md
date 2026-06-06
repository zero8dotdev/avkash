# Plan 38 — SEZ location flag + labour regime rules

Status: **implementation plan**. Tags locations with their labour regime so that SEZ-specific rules
(female night-shift ban, mandatory 6-day week, different overtime threshold) are applied
automatically for factories within Special Economic Zones.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Independent of other plans;
consumed by Plan 30 (gender restrictions).

---

## Why a first-class flag matters

Currently SEZ-specific rules would have to be hardcoded per location by name or ID. Any new factory
added later would silently miss the rules. A `laborRegime` field on `Location` means the rules follow
the data — add a new SEZ factory, set the flag, all compliance checks apply automatically.

---

## Enum

New Postgres enum `labor_regime` in `packages/db/src/schema/enums.ts`:

```
STANDARD           — Factories Act / Shops & Establishments Act (default for HQ)
SEZ                — Special Economic Zone regime
SHOP_ESTABLISHMENT — Shops & Establishments Act only (for offices outside factories)
OTHER              — catch-all for international/custom regimes (field sales offices)
```

---

## Schema

`packages/db/src/schema/location.ts` — add one column:

```
laborRegime   labor_regime   notNull   default 'STANDARD'
```

Existing locations are migrated to `STANDARD` by default. HR then updates the 4 factory locations to
`SEZ` via the API.

---

## Domain (`@avkash/org`)

`updateLocation` (existing, `org/locations.ts`) — `laborRegime` is now a patchable field. ADMIN
only. Existing concurrency control (`version` + `If-Match`) applies.

Add a pure helper (tested, no DB):

```ts
function isSEZ(location: { laborRegime: LaborRegime }): boolean {
  return location.laborRegime === 'SEZ'
}
```

---

## SEZ-specific rules enforced across the codebase

| Rule | Where enforced | Triggered by |
|------|---------------|-------------|
| Female night-shift ban | `assignShift` (Plan 30) | `isSEZ(location) && shift.allowedGenders != null` |
| 6-day mandatory workweek | Roster generator (Plan 24) + `validateAssignment` | `isSEZ(location)` → warn if `workweek` doesn't include Saturday |
| Overtime threshold | `resolveDay` (Plan 39) | `isSEZ(location)` → different `fullDayHours` for OT calc |

These rules are not hardcoded constants — each consuming plan reads `location.laborRegime` and
branches. This plan provides the field; consuming plans wire their specific logic.

---

## SEZ 6-day workweek validation

In `validateAssignment` (Plan 24), add a new warning type:

```
If isSEZ(location) AND isWorkday(userWorkweek, SATURDAY) == false:
  warnings.push({ type: 'SEZ_SATURDAY_REQUIRED', userId, date })
```

This does not block the assignment — it warns the planner that the roster may not comply with SEZ
mandatory Saturday requirements. The org's actual workweek setting (via Plan 32) enforces it at the
leave/attendance calculation level.

---

## Overtime threshold for SEZ (preview for Plan 39)

Under many SEZ notifications, overtime triggers after 9 hours (not 8). `resolveDay` currently uses
`shift.fullDayHours` for the overtime threshold. For SEZ locations, this should default to 9h when
not explicitly set on the shift. Plan 39 introduces `Shift.trackOvertime`; this plan provides the
location-level override that Plan 39 reads.

A new optional field on `Location`:
```
overtimeThresholdHours   numeric(4,2)?   (null = use shift.fullDayHours)
```

When set on an SEZ location to 9.0, `resolveDay` uses `location.overtimeThresholdHours ?? shift.fullDayHours` for the OT mark. This is set by HR during location setup.

---

## DTO

`locationDto` (existing in `@avkash/org`) gains `laborRegime` and `overtimeThresholdHours` in the
output — needed by the roster builder and shift validator.

---

## API surface

No new routes. Extensions to existing:

- `PATCH /locations/:id` — gains `laborRegime` and `overtimeThresholdHours` as patchable fields.
- `GET /locations` + `GET /locations/:id` — DTO now includes both fields.

---

## Tests

- `isSEZ({ laborRegime: 'SEZ' })` → true.
- `isSEZ({ laborRegime: 'STANDARD' })` → false.
- `updateLocation` with `laborRegime: 'SEZ'` persists and is returned in the DTO.
- `validateAssignment` emits `SEZ_SATURDAY_REQUIRED` warning when user's workweek excludes Saturday
  and location is SEZ.
- `resolveDay` uses `location.overtimeThresholdHours` when set, `shift.fullDayHours` when null.

---

## Build order

1. Add `labor_regime` enum to `enums.ts`. Add `laborRegime` + `overtimeThresholdHours` to
   `location`. `db:push`.
2. Update existing `STANDARD` rows via a one-line Bun migration script.
3. Add `isSEZ` pure helper.
4. Extend `updateLocation` to accept new fields.
5. Extend `locationDto`.
6. Tests.
