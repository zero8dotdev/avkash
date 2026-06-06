# Plan 27 — Manufacturing Organisation Model (Master Plan)

Status: **design locked**. This master plan captures the 20 gaps identified when modelling a
multi-factory SEZ manufacturing organisation in Avkash v2. Each gap has an individual plan (linked
below). This document defines the dependency graph, build phases, and non-negotiable cross-cutting
decisions that all individual plans must respect.

---

## Organisation profile (the client)

- **Legal entity**: single parent company, one employer registration.
- **Locations**: 4 factories (all in SEZ, different states) + 1 corporate HQ (different state). Five
  `Location` rows.
- **Departments**: not uniform across factories — each factory has a different mix. Departments are
  structural units distinct from Teams.
- **Subsidiary**: a sales entity with a different brand name but same legal registration.
- **Employment levels**: `WORKER` (blue-collar, ~75%), `EXECUTIVE` (middle management), `MANAGEMENT`
  (top leadership), `FIELD` (remote sales). Each level has its own shift rules, leave policy,
  attendance source, and overtime behaviour.
- **Shifts** (workers): Morning 06:00–14:00, Afternoon 14:00–22:00, Night 22:00–06:00, General
  (maintenance/executive) 10:30–18:30. Females banned from Night shift by SEZ law.
- **Top management**: flexible shift, self-declared attendance, multi-location.
- **Field sales**: self-declared attendance, regional manager → central sales head hierarchy.
- **Compliance**: SEZ labour regime applies to all 4 factories (different OT rules, mandatory 6-day
  week, female night-shift prohibition). HQ is under standard regime.

---

## What already works (no new plans needed)

| Capability | Covered by |
|---|---|
| 5 locations with IANA timezones | `Location` table (Plan 23) |
| Per-location holiday calendars | `Holiday.locationId` (Plan 16) |
| Night shift midnight crossing | `Shift.crossesMidnight` (Plan 23) |
| Flexible shift for top management | `Shift.isFlexible` (Plan 24) |
| Biometric device management | `Device` + `DeviceEnrollment` (Plan 23) |
| Probation employment status | `EmployeeProfile.employmentStatus = PROBATION` (Plan 18) |
| Comp-off for weekend/holiday work | `CompOff` module (Plan 14) |
| Leave encashment | `Encashment` module (Plan 14) |
| Retroactive leave (computed-on-read) | Attendance resolver (Plan 23) |
| Muster roll | Plan 25 |

---

## Individual plans (gap → plan)

### Tier 1 — Critical (blocks onboarding any factory)

| Plan | Gap | Depends on |
|------|-----|-----------|
| [Plan 28](28-departments.md) | Department entity + factory matrix | — |
| [Plan 29](29-employment-level.md) | Employment level / grade field | — |
| [Plan 30](30-gender-shift-restrictions.md) | Gender-based shift restrictions (SEZ legal) | 29, 38 |
| [Plan 31](31-attendance-source-enforcement.md) | Attendance source enforcement per level | 29 |

### Tier 2 — High (needed for operational correctness)

| Plan | Gap | Depends on |
|------|-----|-----------|
| [Plan 32](32-alternate-saturday.md) | Alternate Saturday workweek pattern | — |
| [Plan 33](33-leave-blackout.md) | Leave blackout / lock-in periods | 28 |
| [Plan 34](34-transfer-management.md) | Transfer management (effective-dated location) | 28 |
| [Plan 35](35-floating-manager.md) | Floating manager / multi-location user | 34 |
| [Plan 36](36-leave-policy-by-level.md) | Leave policy scoped by employment level | 29 |
| [Plan 37](37-shift-eligibility.md) | Shift eligibility rules (level + gender) | 29, 30 |

### Tier 3 — Medium (significant but not blocking)

| Plan | Gap | Depends on |
|------|-----|-----------|
| [Plan 38](38-sez-labour-regime.md) | SEZ location flag + labour regime rules | — |
| [Plan 39](39-overtime-differentiation.md) | Overtime tracking differentiation by level | 29 |
| [Plan 40](40-field-sales-attendance.md) | Field sales self-declaration approval | 31 |
| [Plan 41](41-business-unit.md) | Subsidiary / brand entity | — |
| [Plan 42](42-device-context.md) | Gate vs department punch context | — |
| [Plan 43](43-probation-leave-policy.md) | Probation-specific leave policies | 29 |

### Tier 4 — Low (quality, edge-case correctness)

| Plan | Gap | Depends on |
|------|-----|-----------|
| [Plan 44](44-shift-supervisor.md) | Shift supervisor role | 28, 29 |
| [Plan 45](45-shift-aware-half-day.md) | Shift-aware half-day leave | 29 |
| [Plan 46](46-remote-work-logging.md) | Remote work location logging | — |
| [Plan 47](47-policy-module.md) | Policy module (`@avkash/policy`) | 28, 29 |

---

## Dependency graph

```
Plan 29 (Employment Level)
  ├── Plan 30 (Gender restrictions)  ← also needs Plan 38
  ├── Plan 31 (Source enforcement)
  │     └── Plan 40 (Field sales approval)
  ├── Plan 36 (Leave policy by level)
  ├── Plan 37 (Shift eligibility)   ← also needs Plan 30
  ├── Plan 39 (Overtime diff.)
  ├── Plan 43 (Probation policy)
  ├── Plan 44 (Shift supervisor)    ← also needs Plan 28
  └── Plan 45 (Shift-aware half-day)

Plan 28 (Departments)
  ├── Plan 33 (Leave blackout)
  ├── Plan 34 (Transfer management)
  │     └── Plan 35 (Floating manager)
  └── Plan 44 (Shift supervisor)

Plan 38 (SEZ flag)
  └── Plan 30 (Gender restrictions)

Independent: Plan 32, Plan 41, Plan 42, Plan 46, Plan 47
```

---

## Recommended build sequence

**Wave 1 (foundation — do together):**
Plan 29 → Plan 28 → Plan 38

**Wave 2 (core compliance):**
Plan 30 + Plan 31 + Plan 37 (these three are closely coupled; share a PR)

**Wave 3 (workforce management):**
Plan 34 + Plan 35 + Plan 36 + Plan 32 + Plan 33

**Wave 4 (medium gaps):**
Plan 39 + Plan 40 + Plan 41 + Plan 42 + Plan 43

**Wave 5 (polish):**
Plan 44 + Plan 45 + Plan 46 + Plan 47

---

## Cross-cutting decisions (apply in every individual plan)

1. **`employmentLevel` is on `EmployeeProfile`**, not `User`. It is HR-write, MANAGER-read. All plans
   that gate on level read from `EmployeeProfile`, resolved via the existing `getEmployeeProfile` call.
2. **Department is a structural entity** owned by `@avkash/org`. Teams remain the leave-approval unit.
   A user has both a `teamId` (approval routing) and a `departmentId` (structural/reporting).
3. **SEZ flag is on `Location`**. Plans that need SEZ-specific logic branch on
   `location.laborRegime === 'SEZ'`, not on a hardcoded location list.
4. **All new tables** follow the standard pattern: schema in `packages/db/src/schema/`, enums in
   `enums.ts`, `db:push` (no migration files), DTOs via `createSelectSchema(...).omit(...)`.
5. **All new mutable resources** carry `version` + ETag/If-Match concurrency control.
6. **Effective-date resolvers** (`effectiveLocation`, `effectiveDepartment`, `effectiveWorkweek`)
   follow the same pattern as `shiftForDate` — latest-record-covering-the-date wins; null = use home.
7. **Guards added to existing functions** (`assignShift`, `applyLeave`, `ingestPunch`) must not break
   existing tests. Add the guard behind the new data; if the new data is absent (null), the guard is a
   no-op (backwards-compatible default).
8. **Pure logic gets `bun test`**. Eligibility checks, workweek pattern resolvers, SEZ rule
   calculations — all pure functions, all tested.
