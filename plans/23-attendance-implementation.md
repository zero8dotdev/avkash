# Plan 23 — Attendance implementation (multi-location + machines + shifts + rosters)

Status: **implementation plan**. Turns plan 22 into a build sequence, with the conventions we've
solidified baked into every phase so we don't drift. Locked decisions (from review):

- **Location is a first-class entity** (owns timezone, machines, windows).
- **Per-device auth** — each machine has its own secret (hashed at rest, constant-time compare;
  HMAC-signing is the v2 hardening).
- **Enrollment is per-org** — one `externalId` (badge/biometric) maps to a user across all sites.
- **Rosters up front** — effective-dated `ShiftAssignment`, not a v2 deferral.
- **Allowed-window violations are accepted + flagged**, never rejected.
- (Carried recommendations) worked hours = Σ paired sessions; status becomes **status + marks[]**;
  direction inferred when a device omits it; trust device `ts` + record `receivedAt`; daily record
  **computed-on-read** for now, materialized `AttendanceDay` arrives with payroll (v2).

---

## The non-negotiable patterns checklist (apply in EVERY phase)

Every new table/function/route must follow what the codebase already does:

- **Schema** in `packages/db/src/schema/*`, enums in `enums.ts`, re-export from `schema/index.ts`,
  apply with `pnpm db:push` (no migration files). FKs cross domains freely.
- **DTOs** via `createSelectSchema(table).omit({...})` — drop `orgId`, audit cols, and **secrets**.
  Return through `serialize(dto, data)`; list endpoints use the `{ data }` envelope.
- **Validation** with Zod 4 `validateBody` / `validateQuery`; read `c.get('body')` / `c.get('query')`.
- **Errors** are `DomainError` subclasses (code-first), localized by `@avkash/i18n`; let
  `mapDatabaseError` translate constraint hits. Never hand-roll error JSON.
- **Optimistic concurrency** on every mutable resource (`location`, `device`, `shift`,
  `shiftAssignment` edits): `version` column, `ETag` on GET, **`If-Match` required** on PATCH
  (428 missing / 412 stale) via `concurrency.ts` helpers; UPDATE does a CAS on `version`.
- **Idempotency** middleware on POST creates.
- **Auth**: `ctx`-first domain fns; `requireRole(ctx, 'ADMIN'|'MANAGER')` guards. Device ingest uses
  a new **`requireDevice`** middleware (the per-device twin of `requireInternalToken`).
- **Inherit-by-null cascades** (the workweek/holiday pattern): timezone `user.location →
team.location → org default`; shift `ShiftAssignment(date) → team.defaultShiftId → null`.
- **Audit** every mutation with `writeAudit`.
- **Notifications** via `dispatch` + a **React Email template** per event (`@avkash/emails`), recipients
  via `resolveUsers` / `resolveOrgAdmins`; notify failures are best-effort (never break the action).
- **Secrets** (device secret) shown **once** on create (the API-key pattern), stored hashed.
- **Tests**: pure logic gets `bun test` (this is where attendance finally earns real coverage — the
  shift-mark + timezone + window math are pure and must be tested like `accrual-schedule`).
- Just-in-time packages (`@avkash/tsconfig`, eslint flat config, prettier 120); `turbo typecheck`
  authoritative; rebuild containers with `--force-recreate`; commits `type(scope): …`.

## Where each piece lives

- **Location** → `@avkash/org` (org owns tenant config; evolve `org/locations.ts`).
- **Device, DeviceEnrollment, Shift, ShiftAssignment, the resolver** → `@avkash/attendance` (domain).
- **`requireDevice`** middleware → `apps/api/src/middleware/device-auth.ts` (mirrors `internal-auth.ts`).
- **Attendance email templates** → `@avkash/emails`.
- Routes in `apps/api/src/routes/{locations,devices,shifts,attendance}.ts`, mounted in `app.ts`.

---

## Phase 1 — Locations as entities (foundation)

**Schema** `schema/location.ts`:

- `location`: `id`, `orgId` (FK), `name` (varchar), `timezone` (varchar IANA, notNull, default
  `'UTC'`), `address` (varchar?), `latitude`/`longitude` (numeric?), `geofenceRadiusM` (int?),
  `ipAllowlist` (varchar[]?), `punchWindowStart`/`punchWindowEnd` (time?, null = always open),
  `isActive` (bool default true), `version` (int default 0), audit cols. Unique `(orgId, name)`.
- Add nullable `locationId` FKs (keep existing string columns as denormalized labels during
  transition — do **not** rip them out): `user.locationId` (home location), `team.locationId`,
  `holiday.locationId`, `attendancePunch.locationId`.

**Backfill** (one-off script, like `db/` era but a Bun script): per org, gather distinct strings from
`organisation.location[]` + `team.location` + `holiday.location` → create `Location` rows (timezone
seeded from `team.timeZone` when known, else `'UTC'` + flag for admin); map `team`/`holiday` string →
`locationId` by name. Existing `resolveHolidays` keeps using the string until consumers migrate.

**Domain** (`org/locations.ts` evolved): `createLocation`, `listLocations`, `getLocation`,
`updateLocation` (concurrency), `archiveLocation` — `requireRole(ctx,'ADMIN')`, `version`/ETag, audit.

**Routes** `routes/locations.ts`: `POST /locations` (idempotency), `GET /locations`,
`GET /locations/:id` (ETag), `PATCH /locations/:id` (If-Match). `locationDto` omits orgId/audit.

**Resolver touch**: `loadCalendar` reads timezone from the user's effective location
(`user.location → team.location → org`), replacing the raw `team.timeZone` string read.

**Tests**: `effectiveLocation`/timezone cascade (pure) — `bun test`.

## Phase 2 — Devices, enrollment, ingest

**Enums**: `deviceKindEnum` (`BIOMETRIC,RFID,FACE,KIOSK,MOBILE`), `deviceStatusEnum`
(`ACTIVE,INACTIVE`). (`attendance_source` already has `DEVICE`.)

**Schema** `schema/device.ts`:

- `device`: `id`, `orgId`, `locationId` (FK), `name`, `kind`, `serial?`, `secretHash` (notNull),
  `status` (default ACTIVE), `lastSeenAt?`, `version`, audit. The raw secret is returned **once** at
  create and never stored.
- `deviceEnrollment`: `id`, `orgId`, `userId` (FK), `externalId` (varchar), `label?`, `createdAt`.
  Unique `(orgId, externalId)` — **per-org** identity map.
- `attendancePunch` additions: `deviceId?` (FK), `flagged` (bool default false), `flagReason?`
  (varchar), `receivedAt?` (timestamp). Dedupe index `unique (deviceId, userId, ts)` for exact retries.

**Device auth** — `middleware/device-auth.ts` (`requireDevice`): read `X-Device-Id` + the secret
(bearer); look up device, **constant-time** compare `sha256(secret)` to `secretHash`; set a device
context `{ deviceId, orgId, locationId }`. Mirrors `requireInternalToken` but per-device + revocable.

**Domain** (`attendance/device.ts`, `attendance/ingest.ts`):

- Device CRUD + enrollment CRUD — `requireRole ADMIN`; create returns the secret once (API-key style).
- `ingestPunch(deviceCtx, { externalId, ts, direction? })`:
  1. `externalId → userId` via enrollment (per-org); unknown → `NotFoundError('ENROLLMENT')`.
  2. **direction inference** when absent: toggle off the user's last punch in the shift-day.
  3. **allowed-window check** (location window in its TZ) → on violation set `flagged=true` +
     `flagReason` (accept-and-flag), never reject.
  4. write punch `source:'DEVICE'`, `locationId` from device, `receivedAt=now`; idempotent on
     `(deviceId, userId, ts)` via `onConflictDoNothing`.
  5. `device.lastSeenAt = now`.

**Routes**: `routes/devices.ts` (CRUD + `/devices/:id/enrollments`), `routes/attendance.ts` gains
`POST /attendance/punch` behind `requireDevice` (not `requireAuth`). `deviceDto` omits `secretHash`.

**Tests**: allowed-window check (pure: window + ts + tz → in/out), direction inference rule.

## Phase 3 — Shifts, rosters, shift-aware resolver (the keystone)

**Schema** `schema/shift.ts`:

- `shift`: `id`, `orgId`, `name`, `startTime` (time), `endTime` (time), `crossesMidnight` (bool),
  `breakMinutes` (int), `graceMinutes` (int), `fullDayHours` (numeric), `halfDayHours` (numeric),
  `isFlexible` (bool), `version`, audit.
- `shiftAssignment` (the roster): `id`, `orgId`, `userId` (FK), `shiftId` (FK), `fromDate` (date),
  `toDate` (date?, null = open-ended), `createdBy`. Index `(userId, fromDate)`. No-overlap rule
  enforced in the domain (latest `fromDate` covering the date wins).
- `team.defaultShiftId?` (FK) — the cascade baseline.

**Domain** (`attendance/shift.ts` + evolve the resolver):

- Shift CRUD (concurrency), roster `assignShift` / `listAssignments` / `clearAssignment`.
- `shiftForDate(orgId, userId, date)` → effective-dated assignment covering `date`, else
  `team.defaultShiftId`, else `null` (the cascade).
- **`resolveDay` v2** — now takes `{ shift, timezone, policy, punches, leaves, holidays, workweek }`
  and returns `{ status, marks[], firstIn, lastOut, workedHours, overtimeHours }`. Precedence at the
  top is unchanged (HOLIDAY > WEEKLY_OFF > ON_LEAVE > worked > ABSENT). New, **all in the location
  TZ with overnight attribution**:
  - pair IN/OUT into sessions; `workedHours = Σ session durations − unpaid breaks`.
  - marks: `LATE` (firstIn > start+grace), `EARLY_DEPARTURE` (lastOut < end−grace),
    `HALF_DAY` (worked < halfDayHours), `OVERTIME` (worked > fullDayHours), `ON_TIME`.
  - no shift → present/absent + raw hours (today's behavior), no marks.

**Timezone helper** (`attendance/tz.ts`, pure, no dep): UTC instant → location wall-clock via
`Intl.DateTimeFormat(..., { timeZone })`; "is instant after `HH:MM` local". (Luxon/Temporal noted as
alternatives; start dependency-free.) **This module is heavily unit-tested.**

**Status shape**: `DayAttendance` gains `marks: string[]`, `workedHours`, `overtimeHours`. `status`
enum unchanged; marks are computed (not stored) → no new enum.

**Routes**: `routes/shifts.ts` (CRUD + `/shifts/assignments` roster). DTOs `shiftDto`,
`shiftAssignmentDto`. `/attendance/me|:userId|today` now surface marks + hours.

**Tests** (the big one): `bun test` over the mark + TZ + overnight + grace + half-day + OT logic —
the long-overdue real coverage for the engine.

## Phase 4 — Regularization + comp-off (reuse the approval engine)

- `schema/regularization.ts`: request to fix a day (target date, proposed punches/status, reason,
  status, approver fields). Approval reuses `canApprove` + the leave comment thread + escalation.
- On approval → write `source:'REGULARIZATION'` punches; recompute (computed-on-read = nothing to do).
- Comp-off link: punches on `WEEKLY_OFF`/`HOLIDAY` → `earnCompOff` (manager-approved).
- Notifications: `attendance.regularization.requested|resolved`, `attendance.missing_punch` — new
  templates + `dispatch`.

## Phase 5 — Reports & payroll feed

- Muster roll (person × day grid), late/absence reports, a payroll feed (present/LOP/OT days) —
  `routes/reports.ts` additions, role-gated.

## Phase 6 — v2 hardening

- Materialized `AttendanceDay` + **period lock** (payroll freeze; backdated punches → adjustments).
- Geofence/IP enforcement; HMAC request-signing upgrade; device-fleet health + offline alerts.

---

## Migration & risk notes

- **Don't break holidays-by-location**: keep the string columns alongside the new `locationId` FKs;
  migrate `resolveHolidays` to `locationId` only after backfill is verified.
- **Timezone is load-bearing**: every shift/window/“today” computation goes through the location TZ
  helper — never `new Date()` server-local. Lock this in Phase 1/3 and test it.
- **Idempotency on ingest** is essential (offline batches retry); the `(deviceId, userId, ts)` unique
  index is the gate.
- **Computed-on-read** stays until payroll; revisit materialization in Phase 6 with the lock.

## Build order

Phase 1 → 2 → 3 are the "multi-location + machines + shifts + rosters" core (and where the tests
land). 4 → 6 round it out. Recommend building **Phase 1 first** and validating the timezone cascade
end-to-end before devices.
