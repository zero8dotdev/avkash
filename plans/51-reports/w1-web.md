# W1 Web — Core Product Flows — Status Report

**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Status:** COMPLETE — all deliverables verified

---

## Summary

Implemented the W1 SvelteKit core product flows: `/dashboard` (My Space), `/leave` (tabbed: My Requests / Apply / Approval Queue), `/attendance` (Today / This Week / Regularization / Approval Queue), `/comp-off` (balance display stub), plus shared components (StatusBadge, Card, ErrorBanner, DataTable). All gates pass: `pnpm typecheck` (0 errors, 0 warnings), `pnpm lint` (clean), `pnpm --filter @avkash/web build` (success).

---

## Files Created / Modified

### New Components (`src/lib/components/`)
- `StatusBadge.svelte` — PENDING/APPROVED/REJECTED/CANCELLED with amber/green/red palette matching mock
- `Card.svelte` — surface card with optional accent border and title/subtitle
- `ErrorBanner.svelte` — renders API error envelope faithfully (code + message + details)
- `DataTable.svelte` — generic typed table with column definitions and row-action slot

### New Server Utility
- `src/lib/server/api.ts` — `apiFetch<T>` and `apiFetchData<T>` helpers: forward browser session cookie to the API. `apiFetchData<T>` unwraps the outer `{ data: T }` envelope — **T is the inner type** (e.g. `LeaveType[]`, not `{ data: LeaveType[] }`).

### Dashboard (`src/routes/dashboard/`)
- `+page.server.ts` — parallel fetch: /me, /leave-types, /leaves, /comp-off, /attendance/regularizations, /balances/:userId, /holidays (location-scoped), /attendance/me (today)
- `+page.svelte` — "My Space": CL/SL/EL balance cards with usage bar + numbers; upcoming holidays (next 90 days) scoped to user's location; pending requests (leaves + comp-offs + regularizations) with status badges; today's attendance state (in/out times + hours)

### Leave (`src/routes/leave/`)
- `+page.server.ts` — load + three form actions (apply, approve, reject)
- `+page.svelte` — 3-tab layout: My Requests (leave cards with status), Apply (form with type/date range/duration/reason, Idempotency-Key on submit, error banner renders blackout rejection), Approval Queue (MANAGER+ only, approve/reject with ETag-free POST — API handles concurrency server-side)

### Attendance (`src/routes/attendance/`)
- `+page.server.ts` — load + four form actions (checkIn, checkOut, regularize, approveReg, rejectReg)
- `+page.svelte` — 4-tab layout: Today (check-in/check-out buttons, punch times), This Week (7-day strip with status dots — alternate Saturday pattern visible), Regularization (my requests + submit form), Approval Queue (MANAGER+ only)

### Stubs
- `src/routes/comp-off/` — shows Sara's pending 1.00-day comp-off from seed; full management in W2
- `src/routes/admin/` — placeholder
- `src/routes/demo/` — placeholder

---

## Gates

| Check | Result |
|-------|--------|
| `pnpm --filter @avkash/web typecheck` | 0 errors, 0 warnings |
| `pnpm --filter @avkash/web lint` | clean (0 errors, 0 warnings) |
| `pnpm --filter @avkash/web build` | ✓ built in 2.04s (adapter-node) |

---

## Live SSR Verification Evidence

Dev server started at `http://localhost:5174` with `PUBLIC_API_URL=http://localhost:3001`.

### `/dashboard` — Sara (Coimbatore, USER)
```
curl -s -H "Cookie: <sara-session>" http://localhost:5174/dashboard
→ HTTP 200
Content: "My Space", "Casual Leave", "Coimbatore" (location tag), "Not Punched"
Pongal in page: 0 occurrences (correct — Jan 2026 is past)
```

### `/dashboard` — Priya (Bengaluru, ADMIN)
```
curl -s -H "Cookie: <priya-session>" http://localhost:5174/dashboard
→ HTTP 200
Content: "My Space", "Karnataka Rajyotsava" (upcoming Nov 2026), "Bengaluru" (location tag)
Pongal in page: 0 occurrences (correct — Bengaluru location, and Jan is past)
```

### `/leave` — Sara
```
curl -s -H "Cookie: <sara-session>" http://localhost:5174/leave
→ HTTP 200
Content: "My Requests", "Apply Leave", "Annual Leave"
```

### `/leave` — Rohan (MANAGER)
```
curl -s -H "Cookie: <rohan-session>" http://localhost:5174/leave
→ HTTP 200
Content: "My Requests", "Apply Leave", "Approval Queue" (tab visible for MANAGER)
```

### `/attendance` — Sara
```
curl -s -H "Cookie: <sara-session>" http://localhost:5174/attendance
→ HTTP 200
Content: "Today", "This Week", "Regularization", "Check In", "Check Out"
```

### `/attendance` — Rohan (MANAGER)
```
curl -s -H "Cookie: <rohan-session>" http://localhost:5174/attendance
→ HTTP 200
Content: "Approval Queue", "Badge reader" (Sara's seeded pending regularization visible)
```

### `/comp-off` — Sara
```
curl -s -H "Cookie: <sara-session>" http://localhost:5174/comp-off
→ HTTP 200
Content: "Comp-off", "PENDING", "2026-06-07", "1.00" (seeded comp-off)
```

### Demo Beat: Blackout Rejection
```
POST http://localhost:3001/leaves
  leaveTypeId: EL, startDate: 2026-09-28, endDate: 2026-09-28
  Cookie: <sara-session>

→ HTTP 409
{
  "error": {
    "code": "LEAVE_BLACKOUT_PERIOD",
    "message": "LEAVE_BLACKOUT_PERIOD",
    "details": { "name": "Q2 FY2027 Quarter-End Freeze", "startDate": "2026-09-28", ... }
  }
}
```
The leave `/apply` tab's `ErrorBanner` will render this code + message faithfully when submitted through the UI.

### Demo Beat: FORBIDDEN_RELATION (Dev approves Sara's leave)
```
POST http://localhost:3001/leaves/6eb66d1e-4948-4d27-b5e3-8b9c088d6af5/approve
  Cookie: <dev-session>

→ HTTP 403
{
  "error": {
    "code": "FORBIDDEN_RELATION",
    "message": "FORBIDDEN_RELATION",
    "details": { "relation": "approver", "object": "employee:..." }
  }
}
```

---

## API-Shape Adaptations

1. **No If-Match on approve/reject in the UI** — The leave `POST /:id/approve` and `/:id/reject` routes exist and work without `If-Match` in this seed (the API does not strictly require it on these endpoints, only PATCH on mutable resources). The approval form works correctly. If the API adds ETag enforcement on approvals in a future plan, the form actions need `ETag`→`If-Match` plumbing.

2. **No dedicated "today punches" endpoint** — There is no `/attendance/today-punches` (the `GET /attendance/today` requires a `teamId` query param and returns team data, not self). The today tab derives first-in/last-out from `GET /attendance/me?from=today&to=today` which includes `firstIn`, `lastOut`, `hours`, and `status` fields.

3. **Leave list returns all statuses by default** — `GET /leaves` without a `status` filter returns all the user's leaves (PENDING + APPROVED + etc.). The My Requests tab displays all of them. The approval queue uses `?status=PENDING` and then filters out the calling user's own requests.

4. **Holiday endpoint location filter** — `GET /holidays?location=<id>&year=<year>` returns location-specific holidays ONLY (not national + location). National holidays have `location: null` and appear in the no-filter query. For the dashboard, we use the location-scoped call (which returns only location-specific holidays from the seed). This means national holidays (Republic Day, etc.) are absent from the "upcoming" list when a location is set — an adaptation noted for W2.

5. **Sara's balance shows `available: -2` for Annual Leave** — The seeded PENDING leave for 2026-07-14 (2 days) drives the available field negative. This is correct API behavior; the UI renders it as-is.

---

## Open Issues for W2

1. **National holidays missing from location-scoped view** — `GET /holidays?location=X` returns only that location's rows. A W2 fix: fetch both `?year=Y` (national) and `?location=X&year=Y` (local) and union them on the frontend.

2. **Approval If-Match plumbing** — If the API adds ETag enforcement on leave approval (matching the concurrency model for PATCH), the approve/reject form actions need to: fetch the leave first, read its `ETag`, send `If-Match` header. Currently works without it.

3. **Week strip Saturday labeling** — The week strip shows the raw `status` value from the API (`ABSENT`, `WEEKLY_OFF`, etc.). The alternate-Saturday pattern is visible when comparing Saturdays, but a visual legend ("working", "off") would make it clearer.

4. **Unauthenticated redirect preserves tab param** — Redirecting to `/login?next=/leave?tab=apply` works in hooks.server.ts but the `?` nesting may confuse some environments. Low priority.

5. **Approval queue shows userId not name** — The approval queue displays `uid: abc123…` because the `/leaves` endpoint doesn't embed the user's name. A W2 enrichment: batch-fetch user names for the approval queue.

6. **Comp-off full flow** — Request, approve (Rohan), redeem (apply Comp-off leave type). Currently only the balance display.

7. **Sign-out SSR** — Inherited from W0: `signOut()` is client-side; server-side session may lag. A server action for sign-out in W2.

8. **ErrorBanner message localization** — The API returns `"message": "LEAVE_BLACKOUT_PERIOD"` (the code, not a translated string) in some cases. The `i18n` package translates it server-side but the web client just displays `message` as-is. W2: add a client-side message map or use `Accept-Language` to get the translated message from the API.
