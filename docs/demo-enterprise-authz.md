# Meridian Manufacturing — Enterprise AuthZ Demo Runbook

_Plan 51 WS7 · Avkash v2 · Relationship authorization + field-level visibility_

---

## Overview

This runbook walks through all eight demo beats for the Meridian Manufacturing org.
Each beat shows the audience a live enterprise-grade authorization capability with
zero hand-rolled per-route logic — every access decision is derived from the
relationship graph Avkash already maintains.

---

## Prerequisites

### 1. Docker Compose stack

```bash
# Start everything — Postgres, OpenFGA (migrate + run), API, Worker, Redis
docker compose up -d --build --force-recreate api worker

# Confirm FGA is healthy
curl http://localhost:8080/healthz          # {"status":"SERVING"}
curl http://localhost:3001/health/ready     # {"status":"ready"}
```

### 2. Schema sync

```bash
pnpm db:push
```

### 3. Seed Meridian Manufacturing

```bash
pnpm demo:seed
```

This creates the org, business units, departments, teams, personas, a pending leave
request for Sara, field-policy baseline, and runs `syncOrgTuples`. It also writes
the Anita HRBP tuple directly to FGA (see HRBP caveat below). Copy the JSON printed
at the end into your shell environment:

```bash
export MERIDIAN_ORG_ID=<orgId>
export MERIDIAN_PRIYA_ID=<priyaId>
export MERIDIAN_ROHAN_ID=<rohanId>
export MERIDIAN_SARA_ID=<saraId>
export MERIDIAN_DEV_ID=<devId>
export MERIDIAN_ANITA_ID=<anitaId>
export MERIDIAN_SARA_PROFILE_ID=<saraProfileId>
export MERIDIAN_SARA_LEAVE_ID=<saraLeaveId>
export MERIDIAN_TEAM_ASSEMBLY_ID=<teamAssemblyId>
export MERIDIAN_TEAM_LOGISTICS_ID=<teamLogisticsId>
export MERIDIAN_LEAVE_TYPE_ID=<leaveTypeId>
```

### 4. Worker process

The worker must be running for the outbox relay to propagate tuple changes:

```bash
docker compose up -d worker
# or in dev: pnpm --filter @avkash/worker dev
```

### 5. FGA model loaded at boot

The API calls `ensureStore` + `ensureModel` at boot (see `apps/api/src/index.ts`),
so the core authorization model is written automatically when the API starts.

---

## Personas

| Name  | Role    | Team       | FGA relation |
|-------|---------|------------|--------------|
| Priya | ADMIN   | General    | org.hr_admin |
| Rohan | MANAGER | Assembly   | team.manager |
| Sara  | USER    | Assembly   | team.member  |
| Dev   | MANAGER | Logistics  | team.manager |
| Anita | USER    | General    | bu.hrbp (manual FGA tuple — see caveat) |

---

## Beat-by-Beat Guide

### Beat 1 — The org chart IS the policy

**Enterprise pitch:** _"No manager checks to write. The org chart is the policy."_

Rohan approves Sara's leave because he manages Team Assembly.
Dev is rejected because he manages Logistics, not Assembly.

```bash
# Rohan approves Sara's leave → 200
curl -s -X PATCH http://localhost:3001/leaves/$MERIDIAN_SARA_LEAVE_ID \
  -H "Cookie: <rohan-session>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'

# Dev tries → 403 FORBIDDEN_RELATION
curl -s -X PATCH http://localhost:3001/leaves/$MERIDIAN_SARA_LEAVE_ID \
  -H "Cookie: <dev-session>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'
```

**Expected output:**
- Rohan: `{"leaveId":"...","isApproved":"APPROVED",...}` (HTTP 200)
- Dev: `{"error":{"code":"FORBIDDEN_RELATION",...}}` (HTTP 403)

**What to say while it runs:** "We didn't write a single line of 'is this the right manager?' code. The FGA model derives the approver set from the team membership tuples written when we created Rohan's manager relationship."

**Smoke test:**
```bash
pnpm demo:smoke --beat 1
```

---

### Beat 2 — Delegation in one call

**Enterprise pitch:** _"One delegation POST covers every permission the delegator held — automatically, for a bounded window."_

Rohan is going on leave. One delegation POST gives Dev approval rights on Team Assembly, but only within the date window.

```bash
# Get today's date and tomorrow
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)

# Rohan delegates to Dev for Team Assembly
curl -s -X POST http://localhost:3001/delegations \
  -H "Cookie: <rohan-session>" \
  -H "Content-Type: application/json" \
  -d "{\"toUserId\":\"$MERIDIAN_DEV_ID\",\"teamId\":\"$MERIDIAN_TEAM_ASSEMBLY_ID\",\"startsOn\":\"$TODAY\",\"endsOn\":\"$TOMORROW\"}"

# Dev can now approve Sara's leave (inside the window)
curl -s -X PATCH http://localhost:3001/leaves/$MERIDIAN_SARA_LEAVE_ID \
  -H "Cookie: <dev-session>" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'
```

**Expected output:**
- Delegation POST: `{"id":"...","fromManagerId":"...","toUserId":"...","startsOn":"...","endsOn":"..."}` (HTTP 201)
- Dev approval: HTTP 200 (inside window) → HTTP 403 after `endsOn` passes

**What to say:** "This is a conditioned FGA tuple — the `active_window` condition evaluates `now >= starts && now <= ends`. One write covers everything Dev could have approved as Rohan's delegate. Change the endsOn to yesterday and approve again — 403 immediately."

**Smoke test:**
```bash
pnpm demo:smoke --beat 2
```

---

### Beat 3 — Revocation propagates

**Enterprise pitch:** _"Transfer an employee and their old manager loses access in seconds — the delay is measurable and bounded."_

Transfer Sara from Assembly to Logistics. Rohan loses viewer rights on Sara's profile.

```bash
# Step 1: Priya initiates a transfer (Sara → Logistics)
curl -s -X POST http://localhost:3001/transfers \
  -H "Cookie: <priya-session>" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$MERIDIAN_SARA_ID\",\"toTeamId\":\"$MERIDIAN_TEAM_LOGISTICS_ID\",\"effectiveOn\":\"$(date +%Y-%m-%d)\"}"

# Step 2: Priya approves the transfer
TRANSFER_ID=<id from step 1>
curl -s -X PATCH http://localhost:3001/transfers/$TRANSFER_ID/approve \
  -H "Cookie: <priya-session>"

# Step 3: Check outbox lag metric
curl -s http://localhost:3001/internal/authz/outbox \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}"
# {"outboxDepth":0,"oldestUnpublishedAgeMs":0}

# Step 4: Verify Rohan lost viewer on Sara
curl -s "http://localhost:3001/internal/authz/explain?relation=viewer&object=employee:$MERIDIAN_SARA_PROFILE_ID&user=user:$MERIDIAN_ROHAN_ID" \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}"
# paths: [] (no more viewer relation)

# Step 5: Verify Rohan gets 403 on Sara's employee detail
curl -s http://localhost:3001/employees/$MERIDIAN_SARA_PROFILE_ID \
  -H "Cookie: <rohan-session>"
# {"error":{"code":"FORBIDDEN_RELATION",...}}
```

**Expected output:** `outboxDepth: 0` (relay ran), `paths: []` (Rohan has no viewer), HTTP 403 on employee GET.

**What to say:** "The fast-lane: when a transfer is approved, the route synchronously calls `syncOrgTuples` best-effort. The outbox event is the reliability guarantee behind it. Show the depth metric — zero means the relay cleared it. That gap is the measurable, defensible, bounded delay window."

**Smoke test:**
```bash
pnpm demo:smoke --beat 3
```

---

### Beat 4 — Field-level visibility, live

**Enterprise pitch:** _"Compensation data is invisible to managers — completely absent from the API response, not masked. One policy flip, no deploy."_

Rohan sees Sara's profile with no compensation keys. Priya flips a `field_policy` row. Anita (HRBP) now sees compensation.

```bash
# Step 1: Rohan GETs Sara's profile — no compensation keys
curl -s http://localhost:3001/employees/$MERIDIAN_SARA_PROFILE_ID \
  -H "Cookie: <rohan-session>"
# Response: {name, designation, ...} — NO salary, bankAccount etc.

# Step 2: Priya flips hrbp/compensation → read (no deploy needed)
curl -s -X POST http://localhost:3001/field-policies \
  -H "Cookie: <priya-session>" \
  -H "Content-Type: application/json" \
  -d "{\"resource\":\"employee\",\"fieldGroup\":\"compensation\",\"relation\":\"hrbp\",\"access\":\"read\"}"

# Step 3: Anita (HRBP) now sees compensation
curl -s http://localhost:3001/employees/$MERIDIAN_SARA_PROFILE_ID \
  -H "Cookie: <anita-session>"
# Response: {name, designation, ..., salary: "...", bankAccount: "..."} — once schema cols exist
```

**Expected output:**
- Rohan: no `salary` / `bankAccount` / `compensation` keys in JSON (field group absent)
- After policy flip: Anita sees compensation fields
- Cache is invalidated on write (no restart needed)

**What to say:** "The field is not null — it's absent. The web client's TypeScript type is `Partial<EmployeeProfile>` for exactly this reason. No GDPR violation by inference. One policy row flip, zero code deployment."

**Caveat:** Compensation/identity/medical schema columns (`salary`, `bankAccount`, `pan`, `aadhaar` etc.) do not exist in EmployeeProfile yet. The field-group enforcement is structurally in place; it will activate when the schema columns are added. Until then, the demo shows the absence-of-fields behaviour on the existing profile fields.

**Smoke test:**
```bash
pnpm demo:smoke --beat 4
```

---

### Beat 5 — No side channels

**Enterprise pitch:** _"You can't infer a salary by sorting on it. The query param is gated by the same group map."_

Dev (no compensation access) tries `?sort=salary` → 403 FORBIDDEN_FIELD.

```bash
# Dev tries to sort by salary — 403 FORBIDDEN_FIELD
curl -s "http://localhost:3001/employees?sort=salary" \
  -H "Cookie: <dev-session>"
# {"error":{"code":"FORBIDDEN_FIELD","details":{"params":["sort=salary"]},...}}

# Sorting by a basic field works fine
curl -s "http://localhost:3001/employees?sort=name" \
  -H "Cookie: <dev-session>"
# 200 with employee list
```

**Expected output:** `{"error":{"code":"FORBIDDEN_FIELD",...}}` (HTTP 403)

**What to say:** "Hiding a field while allowing `?sort=field` is a classic side-channel leak. Our `assertQueryableFields` check uses the same field-group matrix: if you can't read the group, you can't sort on it. The hidden field can't be inferred by binary-search sorting."

**Smoke test:**
```bash
pnpm demo:smoke --beat 5
```

---

### Beat 6 — Least-privilege API key

**Status: SKIPPED** — Resource-scoped API keys are not in scope for Plan 51 WS1–7.

This beat requires Plan 49 Seam 2 (scoped API keys) to be wired into the authz model
with an `api_key` FGA type and `requireScope` → FGA resource-type tuple check. When
implemented, a partner API key scoped to `Plants BU` would allow `GET /attendance?bu=plants`
(200) but deny `GET /attendance?bu=corporate` (403).

**Smoke test:**
```bash
pnpm demo:smoke --beat 6
# Output: ⊘ Beat 6 SKIPPED
```

---

### Beat 7 — Answer the auditor

**Enterprise pitch:** _"Why does Priya see salaries? Here's the exact relation path, live, queryable, auditable."_

The FGA Expand API returns a recursive tree of "who has this relation and why". The
`/internal/authz/explain` endpoint flattens it into human-readable paths.

```bash
# Why does Priya have 'viewer' on Sara's profile?
curl -s "http://localhost:3001/internal/authz/explain?relation=viewer&object=employee:$MERIDIAN_SARA_PROFILE_ID&user=user:$MERIDIAN_PRIYA_ID" \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}" | jq .
```

**Expected output:**
```json
{
  "relation": "viewer",
  "object": "employee:<saraProfileId>",
  "queriedUser": "user:<priyaId>",
  "paths": [
    "user:<priyaId> ← hr_admin ← org:<orgId>"
  ],
  "tree": { ... }
}
```

**What to say:** "This is the auditor's answer. Not a log query, not a spreadsheet — a live, queryable traversal of the authorization graph. Show the sensitive-read audit table: every time Priya reads Sara's identity or medical data, a row is written to ActivityLog."

**Smoke test:**
```bash
pnpm demo:smoke --beat 7
```

---

### Beat 8 — Honest failure story

**Enterprise pitch:** _"We fail closed, not open. And we can show you exactly what the reconciler repaired."_

Stop the FGA container → every guarded route returns 503 AUTHZ_UNAVAILABLE (never 200).
Restart → recovers. Run the reconciler → repair log shows the state.

```bash
# Step 1: Stop FGA — all guarded routes fail closed
docker stop avkash-openfga-1
curl -s http://localhost:3001/employees/$MERIDIAN_SARA_PROFILE_ID \
  -H "Cookie: <rohan-session>"
# {"error":{"code":"AUTHZ_UNAVAILABLE",...}}  (503 — NEVER 200)

# Step 2: Restart FGA — verify recovery
docker start avkash-openfga-1
# Wait for FGA to be ready:
until curl -sf http://localhost:8080/healthz > /dev/null; do sleep 1; done
curl -s http://localhost:3001/health/ready
# {"status":"ready"}

# Step 3: Run reconciler — show repairs (zero if no drift)
curl -s "http://localhost:3001/internal/authz/reconcile/$MERIDIAN_ORG_ID" \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}" | jq .
# {"orgId":"...","written":0,"deleted":0,"expectedCount":N,"repairs":0}

# Step 4: Inject drift then reconcile
# (manually delete a tuple in FGA or via the FGA playground at http://localhost:8080)
curl -s "http://localhost:3001/internal/authz/reconcile/$MERIDIAN_ORG_ID" \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}" | jq .
# {"repairs":1,"written":1,...}  ← nonzero = upstream bug signal, loud error log
```

**Expected output:**
- While FGA is stopped: `{"error":{"code":"AUTHZ_UNAVAILABLE"}}` on every guarded route
- After restart: `{"status":"ready"}` from /health/ready
- Reconciler: `repairs: 0` (or a non-zero count if drift was injected)

**What to say:** "Beat 8 is the trust beat. Every enterprise security questionnaire asks 'what happens if your authz service goes down?' Our answer: 503 every time, never 200. And if something went wrong while FGA was down, the reconciler finds it and fixes it. The repair count is the measurable drift window."

**Smoke test:**
```bash
pnpm demo:smoke --beat 8
```

---

## Running All Beats

```bash
pnpm demo:smoke
```

---

## Troubleshooting

### FGA store not initialized

**Symptom:** `{"error":{"code":"AUTHZ_UNAVAILABLE",...}}` on startup, or `ensureStore` errors in API logs.

**Fix:** The API calls `ensureStore('avkash')` and `loadAuthzModel` at boot (wired in `apps/api/src/index.ts`). If FGA was not running when the API started:

```bash
# Restart the API after FGA is healthy
docker compose up -d --force-recreate api
curl http://localhost:3001/health/ready   # should return {"status":"ready"}
```

If `FGA_STORE_ID` is set in the environment, `ensureStore` is skipped and that store ID is used directly. Clear it to force re-creation:

```bash
unset FGA_STORE_ID
docker compose up -d --force-recreate api
```

### HRBP tuple missing (Anita has no compensation access)

**Symptom:** Anita gets 403 FORBIDDEN_RELATION on employee GET, or explain shows no HRBP path.

**Root cause:** The HRBP tuple (`user:<anitaId> hrbp business_unit:<plantsId>`) is not derived from the DB schema (BusinessUnit has no `hrbp_user_id` column). It is written as a manual tuple by `pnpm demo:seed`. The nightly reconciler removes it because `deriveExpectedTuples` does not emit it.

**Fix:**
```bash
pnpm demo:seed   # re-seeds the HRBP tuple; idempotent
```

**Long-term fix:** Add `hrbpUserId uuid` column to `BusinessUnit`, instrument it in `derive.ts`, run `pnpm db:push`.

### Compensation fields not appearing (Beat 4)

**Symptom:** Even after field_policy flip, compensation fields are absent from the response.

**Root cause:** `EmployeeProfile` does not have `salary`, `bankAccount`, `pan`, `aadhaar` etc. columns yet. The field-group enforcement is structurally in place (projection at the `serialize` seam) but the columns that map to the `compensation` group do not exist.

**Status:** Forward-compatible design. Add columns to `packages/db/src/schema/employee.ts`, run `pnpm db:push`, and the projection will activate automatically.

### FGA tuples empty (beat 7 shows empty paths)

**Symptom:** `/internal/authz/explain` returns `paths: []`.

**Fix:** Run the backfill to sync all org tuples to FGA:
```bash
pnpm authz:backfill
```

Or re-run the seed (which calls `syncOrgTuples`):
```bash
pnpm demo:seed
```

### Worker not running (delegation tuples not syncing)

**Symptom:** Delegation is created but Dev still gets 403 on approval.

**Fix:** The outbox relay in the worker picks up the `DELEGATION_CREATED` event and calls `syncOrgTuples`. Start the worker:
```bash
docker compose up -d worker
# or dev: pnpm --filter @avkash/worker dev
```

Check the outbox:
```bash
curl -s http://localhost:3001/internal/authz/outbox \
  -H "x-internal-token: ${INTERNAL_API_TOKEN:-dev-cron-token}"
# {"outboxDepth":0,...}  means the relay cleared it
```

### openfga-db-init / openfga-migrate one-shot failures

**Symptom:** `openfga` container fails to start, logs show migration errors.

**Fix:**
```bash
# Check logs
docker compose logs openfga-migrate

# Re-run init + migrate
docker compose up openfga-db-init openfga-migrate
docker compose up -d openfga
```

---

## Caveats and Known Limitations

| Caveat | Detail | Tracked |
|--------|--------|---------|
| HRBP manual tuple | No `hrbp_user_id` on `BusinessUnit`; tuple written directly, removed by reconciler | ws7.md §caveats |
| Compensation/identity schema | `salary`, `pan`, `aadhaar` etc. not in `EmployeeProfile` schema | ws4.md #2, ws7.md |
| Beat 6 API keys | Resource-scoped API keys not in scope for Plan 51 | ws7.md §caveats |
| Beat 2 delegation smoke | Full delegation flow requires a session token; smoke shows reconcile pre-check only | ws7.md |
| FGA store tests (live) | `fga model test` requires `@openfga/cli` binary; authored in `core.fga.yaml` | ws2.md |
