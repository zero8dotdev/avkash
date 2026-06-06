# Plan 34 — Transfer management (effective-dated location)

Status: **implementation plan**. Tracks employee transfers between factories with full history.
A transfer changes the employee's effective location for attendance, holidays, and department — without
changing their employment contract, employee code, or home location on record.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 28 (departments).
Unblocks: Plan 35 (floating manager).

---

## Two kinds of movement

| Type | Duration | Example |
|------|----------|---------|
| `TEMPORARY` | Has `endDate`; employee returns to home location automatically | Cover a factory's maintenance shutdown for 3 weeks |
| `PERMANENT` | No `endDate`; updates home location on completion | Relocation to new factory as the new permanent base |

A temporary transfer does not change `User.locationId` or `User.departmentId`. A permanent transfer,
when marked COMPLETED, _also_ updates these fields as a side-effect.

---

## Schema

`packages/db/src/schema/transfer.ts` (new):

```
transfer
  id                 uuid PK
  orgId              uuid FK → organisation
  userId             uuid FK → user

  fromLocationId     uuid FK → location
  toLocationId       uuid FK → location
  fromDepartmentId   uuid? FK → department   (null = same dept, just different factory)
  toDepartmentId     uuid? FK → department   (null = same dept, just different factory)

  type               transfer_type   (TEMPORARY | PERMANENT)
  startDate          date notNull
  endDate            date?           (null = permanent / open-ended temp)
  status             transfer_status (PENDING | ACTIVE | COMPLETED | CANCELLED)

  authorizedBy       uuid FK → user  (HR head who approved)
  notes              varchar?
  letterUrl          varchar?        (link to generated transfer letter)

  version            integer default 0
  createdAt / updatedAt / createdBy / updatedBy
  CHECK (type = 'PERMANENT' OR endDate IS NOT NULL)  ← temp transfers must have endDate
  INDEX (userId, startDate)
  INDEX (userId, status)
```

New enums in `enums.ts`:
- `transfer_type`: `TEMPORARY | PERMANENT`
- `transfer_status`: `PENDING | ACTIVE | COMPLETED | CANCELLED`

---

## Effective-location resolver

`packages/attendance/src/location.ts` — new pure function:

```ts
function effectiveLocation(
  user: { locationId: uuid },
  transfers: Transfer[],   // active + pending transfers for this user, sorted by startDate desc
  date: Date
): uuid
```

Logic:
1. Find the first transfer where `startDate <= date AND (endDate IS NULL OR endDate >= date)` AND
   `status IN ('ACTIVE')`.
2. If found → return `transfer.toLocationId`.
3. Else → return `user.locationId`.

Similarly `effectiveDepartment(user, transfers, date)` returns `toDepartmentId ?? fromDepartmentId`.

These are pure functions (no DB call), tested in isolation. Callers load transfers once and pass them
in — no N+1 queries.

---

## Where effective-location is consumed

| Consumer | Change |
|----------|--------|
| `resolveDay` (attendance) | Load active transfers; use effective location for holiday calendar + punch window |
| `computeWorkingDays` (leave) | Use effective location for holiday resolution during leave dates |
| `applyLeave` blackout check | Use effective location for blackout scope matching (Plan 33) |
| `assignShift` (Plan 30/37) | Use effective location for SEZ flag check |
| Muster report | Group punches by effective location on each date |

---

## Transfer lifecycle

```
PENDING → ACTIVE (HR activates; startDate has arrived or is today)
ACTIVE → COMPLETED (HR marks complete, or endDate has passed — cron job)
ACTIVE → CANCELLED (HR cancels before endDate; employee returns to home location)
PENDING → CANCELLED (HR cancels before it starts)
```

**Auto-completion cron**: a daily job checks for ACTIVE transfers where `endDate < today` and marks
them COMPLETED. For PERMANENT transfers that complete, it also updates `user.locationId` and
`user.departmentId` to the transfer destination.

---

## Transfer letter

When a transfer is created, the system optionally generates a letter via a React Email template
(`@avkash/emails`). The letter is rendered to HTML and stored (or linked). `letterUrl` on the
transfer record points to it.

This is a stretch feature for the initial build — `letterUrl` column is created but the template
is deferred to `@avkash/documents`.

---

## Domain (`@avkash/org` or `@avkash/users`?)

Transfers are an HR/people operation → owned by `@avkash/users`, new file `users/transfers.ts`:

- `initiateTransfer(ctx, input)` — ADMIN; validates location + dept existence; creates PENDING.
- `activateTransfer(ctx, id)` — ADMIN; PENDING → ACTIVE; validates `startDate <= today`.
- `completeTransfer(ctx, id)` — ADMIN; ACTIVE → COMPLETED; for PERMANENT, updates user home fields.
- `cancelTransfer(ctx, id, reason?)` — ADMIN; PENDING|ACTIVE → CANCELLED.
- `listTransfers(ctx, userId?)` — ADMIN sees all; MANAGER sees direct reports; USER sees own.
- `getTransfer(ctx, id)` — scoped by above.
- `runTransferCompletionSweep(now?)` — cron; completes expired ACTIVE transfers.
- `activeTransfers(orgId, userId, date)` — internal; returns active Transfer rows for a user on a
  date (used by effective-location resolver callers).

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/transfers` | ADMIN | idempotency |
| GET | `/transfers` | ADMIN | `?userId=&status=` |
| GET | `/transfers/me` | USER | own transfers |
| GET | `/transfers/:id` | ADMIN | ETag |
| PATCH | `/transfers/:id` | ADMIN | If-Match (notes, letterUrl) |
| POST | `/transfers/:id/activate` | ADMIN | PENDING → ACTIVE |
| POST | `/transfers/:id/complete` | ADMIN | ACTIVE → COMPLETED |
| POST | `/transfers/:id/cancel` | ADMIN | |

---

## Tests

- `effectiveLocation` returns transfer destination when an ACTIVE transfer covers the date.
- `effectiveLocation` falls back to `user.locationId` when no ACTIVE transfer covers the date.
- TEMPORARY transfer requires `endDate` (schema CHECK enforced at domain level too).
- PERMANENT transfer on COMPLETED updates `user.locationId`.
- `runTransferCompletionSweep` completes transfers whose `endDate < today`.
- MANAGER can view their direct report's transfers; cannot initiate one.

---

## Build order

1. Enums (`transfer_type`, `transfer_status`). Schema (`transfer`). `db:push`.
2. Pure helpers (`effectiveLocation`, `effectiveDepartment`). Tests.
3. Domain functions in `users/transfers.ts`.
4. Integrate `effectiveLocation` into `resolveDay` + `computeWorkingDays` (read-path, no write
   changes — purely changes which holiday calendar / punch window is used).
5. Routes + DTOs.
6. Cron sweep (`runTransferCompletionSweep` in `@avkash/jobs`).
