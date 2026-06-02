# 14 — `@avkash/leave` — Comprehensive Plan

Full-scope rebuild of leave management on the v2 stack: the current behavior **plus** every
roadmap §1C extension, with all permissions server-enforced and balances on a proper ledger.

Source of truth for current rules: `db/triggers/*`, `db/functions/calculate_accruals.sql`,
the existing server actions. This plan supersedes the "v1 vs deferred" split — **we build it all.**

---

## 1. Scope

**Carry over (faithfully):** leave types, team policies, apply/approve/reject, working-days
calc, overlap guard, half-day + shift, the team/org visibility model.

**Fix (today's gaps):** all permission checks move **server-side** (`ctx`-first; the UI-only
checks today are a security hole), balance enforced on apply, `autoApprove` actually applied,
manager team-boundary enforced on approval, visibility enforced in queries.

**Add (§1C):** accruals, rollover/carry-forward with expiry, comp-off (earn + redeem),
encashment, WFH tracking, leave calendar (team + org), manager **delegation** of approvals,
reports (balance / utilization / trends). WhatsApp apply+approve is a *transport* (separate
package) that calls these same functions — out of scope here, unblocked by it.

---

## 2. Design principles

- **`ctx`-first, org-scoped, role-gated.** Every function takes `AuthContext` first; every
  query filters on `ctx.orgId` (the RLS replacement); mutations check `requireRole`.
- **Ledger-based balances** (§4) — one source of truth for accrual, rollover, comp-off,
  encashment, and leave debits. Replaces today's `accruedLeave`/`usedLeave` JSONB.
- **No DB triggers / RLS / pg_cron.** Overlap + audit move into the functions; accrual,
  rollover, and expiry move into `@avkash/jobs` scheduled tasks.
- **Transport-agnostic.** No Hono/Bun in the package — `apps/api` wires the routes.
- **Deps:** `db, shared, auth`. Reads `schema.team` / `schema.holiday` / ledger via
  `@avkash/db` directly.

---

## 3. The balance model (key decision: a ledger)

Today's balance = `leave_summary` view (`taken`/`planned`) + `policy.maxLeaves`. That cannot
express accrual-over-time, rollover-with-expiry, comp-off credits, or encashment debits. So
the source of truth becomes a **`LeaveLedger`** of signed entries:

```
balance(user, type)   = Σ amount  WHERE effectiveOn ≤ today AND (expiresOn IS NULL OR expiresOn ≥ today)
available(user, type) = balance − Σ workingDays of that user's PENDING leaves of that type
```

| Entry `kind` | Sign | Posted when |
|---|---|---|
| `OPENING` | + | org/user setup (opening balance) |
| `ACCRUAL` | + | accrual job (monthly/quarterly) |
| `ROLLOVER` | + | rollover job (year boundary); carries `expiresOn` |
| `COMP_OFF_CREDIT` | + | comp-off approved; carries `expiresOn` |
| `TAKEN` | − | leave **approved** (`leaveId` ref) |
| `ENCASHMENT` | − | encashment approved |
| `ADJUSTMENT` | ± | manual admin correction |
| `EXPIRY` | − | expiry sweep snapshots lapsed credits (optional; or exclude via `expiresOn`) |

Pending leaves are **not** posted to the ledger — they only reduce `available`. The `TAKEN`
debit is posted on approval (with `leaveId`), and reversed (an `ADJUSTMENT`) on cancel.
Idempotency for jobs via a `periodKey` (e.g. `accrual:2026-06`) unique per `(policyId, kind, periodKey)`.

`leave_summary` view is kept for quick reporting, but the **ledger is authoritative** for balance.

---

## 4. Schema deltas (`@avkash/db`)

**New enums:** `leave_type_kind` (`LEAVE`|`WFH`|`COMP_OFF`), `ledger_kind` (the table above),
`comp_off_status` (`PENDING`|`APPROVED`|`REJECTED`|`REDEEMED`|`EXPIRED`), `encashment_status`
(`PENDING`|`APPROVED`|`REJECTED`|`PAID`).

**`LeaveType` +=** `kind` (`leave_type_kind` default `LEAVE`), `isPaid` (bool default true).

**`LeavePolicy` +=** `encashable` (bool), `encashmentMaxDays` (int), `compOffExpiryDays` (int,
default 90), `allowNegativeBalance` (bool default false). (Keeps existing `rollOver` /
`rollOverLimit` / `rollOverExpiry` / `accruals` / `accrualFrequency` / `accrueOn` / `autoApprove`.)

**`Leave` +=** nothing structural — WFH/comp-off-redemption are just leaves whose `leaveType.kind`
differs (WFH posts no ledger debit; comp-off redemption debits the comp-off credit).

**New tables:**
- **`LeaveLedger`** — `id, orgId, userId, leaveTypeId, kind, amount numeric(6,2), effectiveOn date,
  expiresOn date?, leaveId?, periodKey text?, note, createdBy, createdAt`. Indexes on
  `(orgId,userId,leaveTypeId)`, partial unique on `(policyKey/periodKey,kind)` for job idempotency.
- **`CompOff`** — `id, orgId, userId, workedOn date, leaveTypeId, status comp_off_status,
  expiresOn date?, approvedBy?, createdAt`. Approval posts a `COMP_OFF_CREDIT` ledger entry.
- **`Encashment`** — `id, orgId, userId, leaveTypeId, days numeric, amount numeric?, status
  encashment_status, requestedBy, approvedBy?, createdAt`. Approval posts an `ENCASHMENT` debit.
- **`ApprovalDelegation`** — `id, orgId, fromManagerId, toUserId, teamId?, startsOn date,
  endsOn date, createdAt`. Resolves who may approve in a manager's absence.

All pushed via `drizzle-kit push` (snake_case enum names — per the fix in `plans/13`).

---

## 5. Package module layout

```
packages/leave/src/
  working-days.ts   calculateWorkingDays(workweek, holidays, start, end, duration)
  ledger.ts         post(entry) / balanceFor(ctx,user,type) / availableFor(...)  [internal core]
  leave-type.ts     create / list / update            (OWNER/MANAGER; +kind, isPaid)
  leave-policy.ts   create / update / getEffective     (per team+type)
  leave.ts          apply / approve / reject / cancel / list / get
  balance.ts        getBalance / getBalances (per user, all types)
  accrual.ts        runAccruals(frequency)             [called by @avkash/jobs]
  rollover.ts       runRollover() / expireCredits()    [called by @avkash/jobs]
  comp-off.ts       earnCompOff / approve / reject / redeem
  encashment.ts     requestEncashment / approve / reject / markPaid
  wfh.ts            applyWfh / listWfh                 (thin wrapper over leave w/ WFH kind)
  delegation.ts     setDelegation / clearDelegation / resolveApprovers
  calendar.ts       teamCalendar / orgCalendar         (leaves + WFH + holidays merged)
  reports.ts        balanceSummary / utilization / trends
  index.ts
```

---

## 6. Core algorithms (carried over precisely)

**Working days** — count dates in `[start,end]` where the day-of-week ∈ `team.workweek` **and**
the date ∉ holidays (recurring holidays expanded to each year in range). `HALF_DAY` ⇒ `/2`.
Half-day allowed only for single-day leaves, requires a `shift`, gated by `org.halfDayLeave`.

**Overlap guard** (ported from the trigger into `applyLeave`): reject if any existing
non-`REJECTED` leave for the user overlaps the date range **and** (either is `FULL_DAY`, **or**
both `HALF_DAY` with the *same shift*). Different shifts same day are allowed.

---

## 7. Function surface (selected signatures + rules)

```ts
// leave.ts
applyLeave(ctx, { leaveTypeId, startDate, endDate, duration, shift?, reason?, userId? })
  // USER → self; MANAGER+ → any teammate (userId). Validate active type+policy, half-day rules,
  // compute workingDays, run overlap guard, enforce balance (unless unlimited/allowNegative),
  // status = policy.autoApprove ? APPROVED : PENDING. On APPROVED, post TAKEN ledger debit.
  // Audit-log row. Returns Leave.

approveLeave(ctx, leaveId, comment?)   // requireRole MANAGER; org-scoped; team-boundary OR delegation;
rejectLeave(ctx, leaveId, comment?)    // PENDING→APPROVED posts TAKEN debit; →REJECTED no ledger.
cancelLeave(ctx, leaveId)              // owner of leave or MANAGER; reverses TAKEN via ADJUSTMENT.
listLeaves(ctx, filter)                // visibility enforced (USER self / MANAGER team / OWNER org).

// balance.ts
getBalance(ctx, userId, leaveTypeId) → { balance, available, taken, planned, policy }
getBalances(ctx, userId)             → per active type

// comp-off.ts
earnCompOff(ctx, { userId, workedOn, leaveTypeId })   // MANAGER+ grants, or USER requests → PENDING
approveCompOff(ctx, compOffId)                         // posts COMP_OFF_CREDIT (expiresOn = +compOffExpiryDays)
redeemCompOff = applyLeave with a COMP_OFF-kind type   // debits the comp-off credit

// encashment.ts
requestEncashment(ctx, { leaveTypeId, days })   // checks policy.encashable + encashmentMaxDays + balance
approveEncashment(ctx, id)                       // posts ENCASHMENT debit; markPaid(id) → PAID

// delegation.ts
setDelegation(ctx, { toUserId, startsOn, endsOn, teamId? })   // MANAGER+ delegates their approvals
resolveApprovers(orgId, teamId, onDate) → userId[]            // managers + active delegates

// accrual.ts / rollover.ts  (invoked by @avkash/jobs, ctx = system actor)
runAccruals('MONTHLY'|'QUARTERLY')   // per active accrual policy: credit maxLeaves/12 or /4, idempotent
runRollover()                        // at policy.rollOverExpiry: carry min(unused, rollOverLimit) w/ expiry
expireCredits()                      // daily: snapshot/zero entries past expiresOn
```

---

## 8. Permissions & visibility (server-enforced)

| Action | Allowed |
|---|---|
| apply (self) | USER+ |
| apply for another | MANAGER+ (teammate within team; OWNER/ADMIN any) |
| approve / reject | MANAGER+ for own team **or** active delegate; OWNER/ADMIN any |
| cancel | the leave's owner, or MANAGER+ |
| leave-type / policy CRUD | OWNER/ADMIN (policies: MANAGER for own team, configurable) |
| comp-off grant / approve | MANAGER+ |
| encashment approve | OWNER/ADMIN |
| delegation | MANAGER+ (delegate their own approvals) |
| view leaves | USER→self, MANAGER→team, OWNER/ADMIN→org, intersected with `org.visibility` |

Every read is `WHERE orgId = ctx.orgId`; cross-org access throws `ForbiddenError`.

---

## 9. Moving off the database

| Today (DB) | New home |
|---|---|
| `check_overlapping_leaves` trigger | `applyLeave` (app code) |
| `leave_approved_activity_audit` trigger | explicit `ActivityLog` writes in functions |
| `*_activity_audit` triggers (type/policy) | explicit audit writes |
| `calculate_accruals` + pg_cron | `accrual.runAccruals` via `@avkash/jobs` schedule |
| (none — rollover unbuilt) | `rollover.runRollover` + `expireCredits` via `@avkash/jobs` |
| `leave_summary` view | kept for reporting; ledger is authoritative for balance |

---

## 10. API routes (`apps/api`, thin)

```
POST   /leaves                 apply           GET /leaves                list (visibility)
POST   /leaves/:id/approve     approve         POST /leaves/:id/reject    reject
DELETE /leaves/:id             cancel          GET /leaves/:id            get
GET    /leave-types  POST /leave-types  PATCH /leave-types/:id
GET    /leave-policies  POST /leave-policies  PATCH /leave-policies/:id
GET    /balances/:userId       balances
POST   /comp-off  POST /comp-off/:id/approve   POST /comp-off/:id/redeem
POST   /encashments  POST /encashments/:id/approve
POST   /delegations  DELETE /delegations/:id
GET    /calendar?scope=team|org&month=…
GET    /reports/leave?type=balance|utilization|trends
POST   /internal/leave-accrual   POST /internal/leave-rollover   (cron-triggered)
```

---

## 11. Build sequence

Even building "all of it," there's a dependency order. Each phase is curl-validated in Docker.

- **A — Spine** (unblocks everything): schema deltas + `ledger.ts`, `working-days.ts`,
  `leave-type`, `leave-policy`, `apply/approve/reject/cancel/list`, overlap, half-day, balance,
  visibility, audit, routes. *This is the corrected, secure baseline.*
- **B — Time-based credits:** `accrual.ts` + `rollover.ts` + `expireCredits`, wired into
  `@avkash/jobs`, idempotent; `/internal/*` triggers.
- **C — Earn/spend:** `comp-off.ts` + `encashment.ts` (+ policy fields, statuses).
- **D — Surfaces:** `wfh.ts`, `calendar.ts`, `delegation.ts` (+ approver resolution in approve),
  `reports.ts`.

---

## 12. Validation

Per phase, curl flows in Docker against real Postgres (as with auth/org): create type+policy →
apply (overlap/half-day/balance edge cases) → approve (ledger debit appears) → check balance →
accrual run (credits appear, idempotent on re-run) → rollover (carry + expiry) → comp-off
earn→approve→redeem → encashment → delegation approval path → calendar/report shape. Plus
`turbo run typecheck` green and a fresh `db:push`.

---

## 13. Open decisions (defaults chosen; flag to change)

1. **Balance enforcement on apply** — ON (block over-apply) unless `policy.allowNegativeBalance`. ✅
2. **`autoApprove`** — implemented (auto-approve + ledger debit on apply). ✅
3. **Holiday management** lives in `@avkash/org`; leave only reads holidays. ✅
4. **Audit** — explicit `ActivityLog` writes from functions. ✅
5. **WFH** modeled as a `LeaveType.kind = WFH` (no balance debit), not a separate table. ✅
6. **Ledger** is authoritative for balance; `accruedLeave`/`usedLeave` JSONB columns retired. ✅
