# W2 Web — Comp-off + Admin Config Pages — Status Report

**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Status:** COMPLETE — all deliverables verified, all gates pass

---

## Summary

Implemented W2 SvelteKit pages: `/comp-off` (full management with tabs: My Comp-offs / Request / Approval Queue / Encashment), `/admin` (ADMIN/OWNER-gated section with sidebar nav and four config pages: Leave Types & Policies, Workweek Patterns, Holidays & Locations, Blackouts). TopNav already had Comp-off and Admin pills active from W0.

---

## Files Created / Modified

### `/comp-off` (full replacement of W1 stub)
- `src/routes/comp-off/+page.server.ts` — load (myCompOffs, leaveTypes, compOffBalance, pendingQueue for MANAGER+) + four actions: `earn`, `approve`, `reject`, `requestEncashment`
- `src/routes/comp-off/+page.svelte` — 4-tab layout:
  - **My Comp-offs**: list with workedOn, days, status badge, expiry date + color-coded expiry warnings (amber ≤14d, red=expired, green left-border on approved)
  - **Request**: earn form (workedOn date, COMP_OFF leave type selector, days input)
  - **Approval Queue** (MANAGER+ only): pending comp-offs for team members with approve/reject buttons; after approval shows credited expiresOn prominently with "90-day policy — India compliance" label
  - **Encashment**: request form for EL encashment with max-days hint

### `/admin` section (new)
- `src/routes/admin/+layout.server.ts` — ADMIN/OWNER guard: returns `notAuthorized: true` for other roles (no throw — layout handles display)
- `src/routes/admin/+layout.svelte` — two-panel shell: sidebar nav with four items + content area; non-admins get clean "Not Authorized" state with role displayed and Back to Dashboard link
- `src/routes/admin/+page.server.ts` — server-side redirect to `/admin/leave-types` for authorized users
- `src/routes/admin/+page.svelte` — minimal stub (redirect handles it)

### `/admin/leave-types` (new)
- `+page.server.ts` — loads leaveTypes + policies + teams in parallel
- `+page.svelte` — Leave Types table (name/kind/paid/active) + per-team policy matrix table (cap/accrues/carry-forward with rollOverExpiry/encashable/probation); India FY note highlights `03/31` expiry date in amber

### `/admin/workweek-patterns` (new)
- `+page.server.ts` — loads workweekPatterns + teams
- `+page.svelte` — pattern cards with: name, cycle length, reference date; 7-cell week visualizer for each week in the cycle (blue=working, surface=off); assigned teams chips

### `/admin/holidays` (new)
- `+page.server.ts` — loads locations + org-wide holidays + per-location holidays (parallel fetches); unions national + local in the server
- `+page.svelte` — location tab switcher; location metadata cards; combined calendar table with scope column (National vs Location-specific badge); demo note shows national + local counts and named holidays

### `/admin/blackouts` (new)
- `+page.server.ts` — loads blackouts + locations + leaveTypes; two actions: `create` (with Idempotency-Key) and `delete`
- `+page.svelte` — list of active blackouts (name/dates/location/scope chips) with delete button; "+ New Blackout" toggle opens create form (name, dates, location select, leave type select)

---

## Gates

| Check | Result |
|-------|--------|
| `pnpm --filter @avkash/web typecheck` | 0 errors, 0 warnings |
| `pnpm --filter @avkash/web lint` | clean (0 errors, 0 warnings) |
| `pnpm --filter @avkash/web build` | ✓ built in 2.36s (adapter-node) |

---

## Live Verification Evidence

Dev server: `PUBLIC_API_URL=http://localhost:3001 pnpm --filter @avkash/web dev --port 5174` → started at http://localhost:5175

### `/comp-off` — Sara (USER)
```
curl -s -b "better-auth.session_token=<sara-token>" http://localhost:5175/comp-off
→ HTTP 200
Content: "My Comp-offs", "1.00", "2026-06-07", "PENDING" (seeded comp-off visible)
Tabs: My Comp-offs / Request / Encashment (no Approval Queue — USER role)
```

### `/comp-off` — Rohan (MANAGER)
```
curl -s -b "better-auth.session_token=<rohan-token>" http://localhost:5175/comp-off
→ HTTP 200
Tabs: My Comp-offs / Request / Approval Queue / Encashment
"Approval Queue" tab present (MANAGER+ gated)
```

### Approve Sara's comp-off via form action (Rohan)
```
curl -s -b "better-auth.session_token=<rohan-token>" \
  -X POST "http://localhost:5175/comp-off?/approve" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "compOffId=1eb0cd13-2f49-4c77-9920-5e2f84fe85d9"
→ {"type":"success","status":200,"data":"[{\"decisionSuccess\":1,\"action\":2,\"approved\":-1},true,\"approved\"]"}

API verification (GET /comp-off as Rohan):
{
  "id": "1eb0cd13-2f49-4c77-9920-5e2f84fe85d9",
  "workedOn": "2026-06-07",
  "days": "1.00",
  "status": "APPROVED",
  "expiresOn": "2026-09-05",   ← 90-day expiry from workedOn (Chapter 5 compliance beat)
  "approvedBy": "f45b7018-..."  ← Rohan's ID
}
```

### Sara sees approved comp-off with expiry
```
curl -b "<sara-cookie>" http://localhost:5175/comp-off
→ "APPROVED", "Expires", "2026-09-05" (90-day expiry displayed prominently)
```

### `/admin/leave-types` — Priya (ADMIN)
```
curl -s -b "better-auth.session_token=<priya-token>" http://localhost:5175/admin/leave-types
→ HTTP 200
Content: "Earned Leave", "03/31" (rolloverExpiry highlighted), "Casual Leave", "Sick Leave"
Policy matrix visible for Assembly team with EL accrual + rollover columns
```

### `/admin/leave-types` — Sara (USER) — not authorized
```
curl -s -b "better-auth.session_token=<sara-token>" http://localhost:5175/admin/leave-types
→ HTTP 200 (layout renders not-authorized state inline, no redirect)
Content: "Not Authorized", "not-authorized" CSS class, "ADMIN" role reference
Sara's USER role displayed
```

### `/admin/holidays` — Pongal under Coimbatore, Rajyotsava under Bengaluru
```
curl -s -b "better-auth.session_token=<priya-token>" http://localhost:5175/admin/holidays
→ HTTP 200
Content: "Pongal", "Tamil New Year", "Coimbatore", "Karnataka Rajyotsava", "Bengaluru"
National holidays list + location-specific sections both present
```

### `/admin/workweek-patterns` — Alternate Saturday visible
```
→ "Alternate Saturday", "2-week cycle", "Week 1", "Week 2", "Assembly" (assigned team)
Mon–Fri pattern also visible
```

### `/admin/blackouts` — Q2 FY2027 seeded blackout
```
→ "Q2 FY2027", "Quarter-End Freeze", "Coimbatore", "2026-09-25"
New Blackout create form functional
```

---

## API-Shape Adaptations

1. **Location-scoped holidays union**: `GET /holidays?location=X` returns only location-specific rows (not national). The admin holidays page fetches both `?year=Y` (national, location=null) and `?location=X&year=Y` per location, then unions them in the server load function — no API change needed.

2. **Encashments: no list endpoint**: `GET /encashments` does not exist in the API (only POST/approve/pay/reject). The encashment tab provides a request form only (no history list). This is documented as an open issue for W3.

3. **Comp-off pending queue uses `userId` filter**: The `/comp-off` endpoint returns all comp-offs for the calling user's org (for MANAGER+). The server filters `status === 'PENDING' && userId !== currentUser.id` to build the approval queue. Note: the seeded comp-off is Sara's which Rohan can approve as her manager.

4. **`workweekPatternId` on Team**: The Team DTO exposes `workweekPatternId` (from the schema `workweek-pattern-id` soft FK), used to show which teams use each pattern. API confirms this field is present in `/teams` response.

5. **Admin guard is soft (not throw redirect)**: Non-admins hitting `/admin/**` see a clean "Not Authorized" component rendered by the layout rather than a redirect or HTTP 403 throw. This is intentional — graceful degradation per W1 patterns.

---

## Open Issues for W3

1. **Encashment history list** — No `GET /encashments` endpoint in the API. W3: either add a server endpoint or display a "submitted" success state only. Currently the tab shows a request form with no history.

2. **Comp-off approval queue shows userId not name** — The queue shows `uid: abc123…` because `GET /comp-off` doesn't embed user names. W3: enrich with a user lookup (batch fetch names or embed in API).

3. **Admin leave-types: no edit forms** — The policy matrix is read-only. W3: add PATCH forms for policy updates with ETag/If-Match plumbing (version-controlled per the concurrency model).

4. **Admin holidays: no import/add UI** — The holiday calendar is display-only. W3: add add-custom-holiday form and import-from-suggestions flow.

5. **Admin workweek patterns: no create form** — Display-only. W3: create form with cycle visualizer.

6. **Demo state note**: Sara's seeded comp-off (1eb0cd13) was APPROVED during W2 verification. Running `pnpm demo:seed:india` again will re-create it as PENDING only if the seed detects the existing row as already-approved and re-inserts (idempotent on ID). Check seed behavior before the next demo run.

7. **`$effect.pre` init pattern** — The holidays page uses `$effect.pre` to initialize `selectedLocation` from `data.locations[0]` to avoid the Svelte 5 reactivity warning. This is slightly verbose; a cleaner pattern would be to pass a `defaultLocation` prop from the server load.
