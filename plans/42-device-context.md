# Plan 42 — Device context (gate vs department punch)

Status: **implementation plan**. Distinguishes between factory gate punches and department-level
punches so the attendance resolver uses only gate punches for hours calculation, while department
punches provide presence-at-department data without corrupting the IN/OUT session pairing.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Independent of other plans.

---

## The problem

Workers punch at **two points**:
1. The factory gate (entry/exit of the premises)
2. The department biometric (entry/exit of their work area)

Both produce `AttendancePunch` records with the same `userId` and `locationId`. The resolver pairs
punches into IN/OUT sessions to compute worked hours. With two punch points, a day looks like:
`IN(gate) IN(dept) OUT(dept) OUT(gate)` — four punches. The current pairing algorithm
(`pairSessions`) produces two sessions: `IN(gate)→OUT(dept)` and `IN(dept)→OUT(gate)`. Hours
computed from these pairs are wrong.

---

## Design: `deviceContext` on `Device`, inherited by punches

The context belongs on the **device**, not on each punch — a gate reader is always a gate reader.

```
Device.context: device_context   default 'ENTRY_EXIT'
```

New enum `device_context`:
```
ENTRY_EXIT    — main gate; used for hours calculation (IN/OUT session pairing)
DEPARTMENT    — departmental reader; used for presence tracking, not hours
FLOOR         — production-floor station (same as DEPARTMENT semantics)
OTHER         — custom / not classified
```

`AttendancePunch` does **not** gain a new column. The context is resolved at query time via the
device join: `punch → device → context`. This avoids denormalising on every punch insert.

---

## Schema

`packages/db/src/schema/device.ts` — add one column:

```
context   device_context   notNull   default 'ENTRY_EXIT'
```

New enum `device_context` in `enums.ts`.

---

## Resolver change

`pairSessions` in `packages/attendance/src/resolver.ts` currently takes a flat `AttendancePunch[]`.
It must now receive punches annotated with device context:

```ts
type AnnotatedPunch = AttendancePunch & { deviceContext: DeviceContext }
```

Change:
1. `summarizeDay` fetches punches **with a join on `device`** to get `device.context`.
   For punches without a device (WEB/SLACK source), `deviceContext = 'ENTRY_EXIT'` by default
   (they represent the user's single daily check-in, equivalent to gate).
2. `pairSessions` filters: only punches where `deviceContext === 'ENTRY_EXIT'` are used for
   IN/OUT pairing and hours computation.
3. `DEPARTMENT`/`FLOOR` punches are still stored in `AttendancePunch` and returned in the raw
   punch list — they're not discarded. They appear in department presence queries but don't affect
   `workedHours`.

---

## Department presence query (new, optional)

A new read endpoint for department-level presence, useful for floor supervisors:

```
GET /attendance/department-presence?departmentId=&date=
```

Returns a list of `{ userId, name, firstIn, lastOut }` based on `DEPARTMENT`-context punches only.
This is separate from the daily muster (which uses ENTRY_EXIT punches).

This endpoint is **optional** for the initial build — the schema change is the core deliverable.

---

## Device management API extension

`POST /devices` + `PATCH /devices/:id` — gains `context` as a field. ADMIN only.
`GET /devices` + `GET /devices/:id` — `deviceDto` includes `context`.

On setup: HR marks all gate readers as `ENTRY_EXIT` (default) and all department readers as
`DEPARTMENT`. No existing behaviour changes for orgs that have only gate readers.

---

## Backwards compatibility

All existing devices have `context = 'ENTRY_EXIT'` (the column default). All existing punches are
from `ENTRY_EXIT` devices. The resolver behaviour is identical for single-device setups. The join
on `device` is new but fast (indexed on `punch.deviceId`); for WEB/SLACK punches where `deviceId`
is null, the join returns null and context defaults to `ENTRY_EXIT`.

---

## Tests

- `pairSessions` with `[IN(gate), IN(dept), OUT(dept), OUT(gate)]` → one session
  `IN(gate) → OUT(gate)`, correct hours; `IN(dept)/OUT(dept)` excluded.
- `pairSessions` with only ENTRY_EXIT punches → unchanged behaviour.
- `summarizeDay` for a user with mixed-context punches → hours derived from gate punches only.
- Device with `context = 'DEPARTMENT'` — punches from it excluded from session pairing.
- WEB source punch (no device) → treated as `ENTRY_EXIT` context.

---

## Build order

1. Enum (`device_context`). Add `context device_context default 'ENTRY_EXIT'` to `device`. `db:push`.
2. Extend device DTOs + `POST /devices` + `PATCH /devices/:id`.
3. Modify `summarizeDay` to join device context onto punches.
4. Modify `pairSessions` to filter on `ENTRY_EXIT` context.
5. (Optional) `GET /attendance/department-presence` route.
6. Tests.
