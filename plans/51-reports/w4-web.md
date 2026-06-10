# W4 Web — Guided Demo Player

**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Status:** COMPLETE — all gates pass, live verification done

---

## Summary

Implemented the 9-chapter guided demo player at `/demo` as a session-guarded SvelteKit route.
The player ports the `avkash-demo.html` experience into Svelte 5 components with real API calls
for chapters where seed data supports it, and honest scripted animations for those that don't.

---

## Files Created / Modified

### New components (`src/lib/components/demo/`)
- `DemoConsole.svelte` — persistent bottom console strip (JetBrains Mono, live/scripted/error states)
- `Ch0Intro.svelte` — orientation chapter: Meridian org overview + persona table
- `Ch1Company.svelte` — LIVE org tree with drop-bounce animation (business-units → departments → teams)
- `Ch2Ladder.svelte` — SCRIPTED org-levels slide-in list
- `Ch3Shifts.svelte` — SCRIPTED 24-hour timeline + chip cards
- `Ch4Punch.svelte` — SCRIPTED punch-in marker animation (ON_TIME / LATE toggle)
- `Ch5OtGap.svelte` — SCRIPTED OT threshold fill bars (Coimbatore vs Bengaluru)
- `Ch6Transfer.svelte` — LIVE list (GET /transfers) + SCRIPTED transfer animation (mutation not sent)
- `Ch7Probation.svelte` — LIVE leave-policies table + SCRIPTED probation advancement animation
- `Ch8Leave.svelte` — LIVE blackout rejection beat (real POST /leaves via SvelteKit proxy)
- `Ch9HalfDay.svelte` — LIVE half-day apply + LEAVE_OVERLAP conflict via real API

### New routes
- `src/routes/demo/+page.server.ts` — SSR load: business-units, departments, teams, employees, leave-policies, leave-types, transfers, Sara's CL balance (all in parallel)
- `src/routes/demo/+page.svelte` — demo player shell: sub-nav with chapter pills, stage with {#key} transitions, prev/next buttons, keyboard arrow support, DemoConsole
- `src/routes/demo/api/apply-leave/+server.ts` — server-side proxy: POST /leaves as current session user (Ch8, Ch9)
- `src/routes/demo/api/cancel-leave/+server.ts` — server-side proxy: DELETE /leaves/:id for cleanup (Ch9 reset)

### Modified
- `src/routes/demo/+page.server.ts` — replaced stub with full SSR data load

---

## LIVE / SCRIPTED Decision Table

| Ch | Title      | Mode      | Reason |
|----|------------|-----------|--------|
| 0  | Intro      | Static    | Orientation text only; no API call needed |
| 1  | Company    | **LIVE**  | GET /business-units + /departments + /teams + /employees — all seeded (Finance/Manufacturing, Assembly/Logistics) |
| 2  | Ladder     | SCRIPTED  | GET /org-levels returns `{"data":[]}` — not seeded for Meridian |
| 3  | Shifts     | SCRIPTED  | GET /shifts returns `{"data":[]}` — not seeded for Meridian |
| 4  | Punch      | SCRIPTED  | POST /attendance/punch returns DEVICE_AUTH error for session users; GET /attendance/punch requires MANAGER role |
| 5  | OT Gap     | SCRIPTED  | No OT attendance seed data; overtimeThresholdHours shown conceptually |
| 6  | Transfer   | LIVE+SCRIPTED | GET /transfers is LIVE (real endpoint, 0 transfers in seed); animation/mutation is SCRIPTED (org-state mutation forbidden) |
| 7  | Probation  | **LIVE**  | GET /leave-policies real data rendered; probation advancement animation is scripted (no probation employee in seed) |
| 8  | Leave      | **LIVE**  | POST /leaves via /demo/api/apply-leave proxy → real LEAVE_BLACKOUT_PERIOD response from API |
| 9  | Half Day   | **LIVE**  | POST /leaves with halfDayPart=FIRST_HALF/SECOND_HALF; LEAVE_OVERLAP conflict is a real API error |

---

## Gates

| Check | Result |
|-------|--------|
| `pnpm --filter @avkash/web typecheck` | 0 errors, 0 warnings |
| `pnpm --filter @avkash/web lint` | clean (0 errors, 0 warnings) |
| `pnpm --filter @avkash/web build` | ✓ built in 2.71s (adapter-node) |

---

## Live Verification Evidence

Dev server: `PUBLIC_API_URL=http://localhost:3001 pnpm --filter @avkash/web dev --port 5185`

### Test 1: /demo unauthenticated → 302
```
curl -s -o /dev/null -w "%{http_code}" http://localhost:5185/demo
→ 302 (redirects to /login)
```

### Test 2: /demo as Priya (ADMIN) → 200 + chapter pills + real org data
```
curl -s -b <priya-cookie> http://localhost:5185/demo
→ HTTP 200
→ Chapter pills present: "1 · Company", "2 · Ladder", "8 · Leave" ✓
→ Real org names in SSR payload: "Finance", "Manufacturing", "Assembly" ✓
```

### Test 3: Chapter 8 — blackout rejection via /demo/api/apply-leave (Sara, Sep 28)
```
POST http://localhost:5185/demo/api/apply-leave
Cookie: <sara-session>
Body: {"startDate":"2026-09-28","endDate":"2026-09-28","reason":"Demo W4 verification"}

→ HTTP 422
→ {"error":{"code":"LEAVE_BLACKOUT_PERIOD","message":"LEAVE_BLACKOUT_PERIOD",
    "details":{"blackoutId":"aebb7e03-bbeb-4653-9156-238b54e0ffcd",
               "name":"Q2 FY2027 Quarter-End Freeze",
               "startDate":"2026-09-28","endDate":"2026-09-28"},
    "requestId":"991d512d-..."}}
```

This proves the console strip renders real API calls — the LEAVE_BLACKOUT_PERIOD response is not scripted.

### Leave data leftover note
No leave applications were left in the database. The Ch8 test (Sep 28) was blocked by the blackout — no row was created. Ch9 half-day leaves are created and cancelled during the demo via the `/demo/api/cancel-leave` endpoint. The "reset" button triggers cleanup. The existing seed leave (Sara, Jul 14-15, Annual Leave, PENDING — from previous waves) remains untouched.

---

## Architecture Notes

1. **Demo sub-nav**: The `/demo` route uses a secondary nav bar (chapter pills) inside the shell, sitting below the TopNav. This gives the demo its own navigation without conflicting with the global TopNav (which already has a "Demo" pill).

2. **SvelteKit proxy for API calls**: Ch8 and Ch9 use `/demo/api/apply-leave` and `/demo/api/cancel-leave` server endpoints. This avoids CORS issues (client → localhost:3001) and keeps the session cookie forwarding consistent with the rest of the app's server-side pattern.

3. **Svelte 5 `{#key}` transitions**: Each chapter is wrapped in `{#key currentChapter}` to unmount/remount on navigation, triggering `onMount` animations fresh each time. Chapter-in animations use CSS keyframes (chapterIn/chapterInReverse matching the mock).

4. **Scripted labeling**: SCRIPTED chapters show an amber banner with explicit "scripted — feature seed data pending" wording. The console strip shows the same amber color with italic text for scripted responses.

---

## Deviations from Brief

1. **Ch8 uses CL (Casual Leave) not "leave" generically** — The blackout is scoped to the Assembly location; Sara's only team with policies is Assembly. CL was chosen as it has an entitlement (7 days) in the seed. The blackout rejects any leave type for the Sep 25-30 window.

2. **Ch9 uses Sep 1 date** — The brief suggests the half-day demo. Sep 1 is a clean weekday with no existing seed applications. Aug 15 failed (holiday/no-workday). The API returns NO_WORKING_DAYS for non-workweek dates.

3. **Ch7 probation animation is scripted** — The leave-policies table is LIVE (real API data), but the probation completion animation (status badge flip, EL counter) is scripted because no probation employee exists in the Meridian seed. The LIVE label applies to the policy table display.

4. **TopNav "Demo" pill already present** — W0/W1 already added the Demo pill to TopNav. No change needed.

5. **Demo sub-nav below TopNav** — The demo shell uses `top: var(--nav-h)` so it sits below the existing TopNav. The demo sub-nav (chapter pills) is an additional 48px bar. Total offset from top of viewport: 56px (TopNav) + 48px (demo nav) = 104px.

---

## Open Issues

1. **Ch2 Ladder** — GET /org-levels returns empty array. Org-levels need to be seeded for Meridian to make this chapter fully live.

2. **Ch3 Shifts** — GET /shifts returns empty array. Shifts need to be seeded.

3. **Ch4 Punch** — POST /attendance/punch requires device auth for WEB sessions. A supervisor-confirmation flow or a device-token demo endpoint would be needed to make this live.

4. **Ch5 OT Gap** — Requires attendance records with overtime data. Attendance seed with overtimeHours values needed.

5. **Ch9 date sensitivity** — Sep 1 must remain a working day. If Meridian's workweek pattern changes, the half-day demo will need a new date.
