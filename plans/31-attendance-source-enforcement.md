# Plan 31 — Attendance source enforcement per employment level

Status: **implementation plan**. Prevents blue-collar workers from self-declaring attendance via the
web/app while allowing top management and field sales to do exactly that. Source eligibility is
derived from employment level so no per-user configuration is needed.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level). Unblocks: Plan 40 (field sales approval).

---

## The problem

`ingestPunch(source: WEB)` currently accepts any authenticated user. A WORKER in the factory can
open the app and self-declare present without touching a biometric. Conversely, there is no way to
mandate that MANAGEMENT-level users (who move across factories) must use the web to log their
presence because a biometric forces a specific location.

---

## Design: level-based source policy, derived (not stored per user)

A stored `user.allowedPunchSources[]` would require HR to configure every employee individually.
Instead, define a mapping from `employmentLevel` to allowed sources that the org can override:

**Default mapping** (org-wide sensible default):

| Level | Allowed sources |
|-------|----------------|
| `WORKER` | `DEVICE` only |
| `EXECUTIVE` | `DEVICE` only |
| `MANAGEMENT` | `WEB`, `DEVICE` |
| `FIELD` | `WEB` only |
| `null` (unclassified) | all sources (backwards-compatible) |

SLACK punches are always allowed for any level (Slack bot is opt-in per org and already uses the
`requireAuth` path).

---

## Schema

New table `attendance_source_policy` (in `packages/db/src/schema/attendance.ts`):

```
attendance_source_policy
  id               uuid PK
  orgId            uuid FK → organisation
  employmentLevel  employment_level  notNull
  allowedSources   attendance_source[]  notNull
  createdAt        timestamp
  createdBy        uuid
  unique(orgId, employmentLevel)
```

On org creation (or first-time setup), the default mapping is seeded. HR can override per level via
the API. If no row exists for a level, fall back to the default mapping in code.

---

## Guard in `ingestPunch`

`packages/attendance/src/ingest.ts` — after the enrollment lookup, before writing the punch:

```
1. Fetch allowed sources: look up attendance_source_policy for (orgId, employmentLevel).
   If no row found → use code defaults.
2. If source is not in allowed sources:
     throw BusinessRuleError('PUNCH_SOURCE_NOT_ALLOWED', { source, employmentLevel })
3. SLACK source bypasses this check entirely.
```

`employmentLevel` is fetched via `getEmployeeLevel(orgId, userId)` (Plan 29). This is a single
indexed lookup; acceptable overhead per punch.

---

## API surface

Owned by `@avkash/attendance`, routes in `routes/attendance.ts`:

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| GET | `/attendance/source-policy` | ADMIN | list current policy per level |
| PUT | `/attendance/source-policy/:level` | ADMIN | upsert allowed sources for a level |

`PUT` is idempotent (upsert on `(orgId, employmentLevel)` unique constraint). Body:
```json
{ "allowedSources": ["WEB", "DEVICE"] }
```

---

## DTO

`sourcePolicyDto` = `{ employmentLevel, allowedSources }`. Omits orgId, audit.

---

## Error behaviour

When a WORKER tries to punch via WEB, the API returns:

```json
{
  "error": {
    "code": "PUNCH_SOURCE_NOT_ALLOWED",
    "message": "Attendance via web is not permitted for your role. Please use the biometric terminal.",
    "details": { "source": "WEB", "level": "WORKER" }
  }
}
```

The message is localized via `@avkash/i18n` (add the key).

---

## Edge cases

- **Regularization source** (`REGULARIZATION`) is always allowed — it is created by an admin action,
  not a user self-punch. The guard skips the check when `source === 'REGULARIZATION'`.
- **Device punch on behalf** — device ingest uses `requireDevice` auth, not user auth; the guard
  runs with the enrolled user's level. If a FIELD employee's badge is enrolled on a factory device
  (rare but possible during a visit), the DEVICE source is not in FIELD's allowed list — this would
  block. Resolution: HR can temporarily add DEVICE to FIELD's policy, or enroll the employee on the
  visitor device with a note. The system should not silently allow it.

---

## Tests

- WORKER punch via `source: WEB` → `PUNCH_SOURCE_NOT_ALLOWED`.
- MANAGEMENT punch via `source: WEB` → accepted.
- FIELD punch via `source: WEB` → accepted.
- WORKER punch via `source: DEVICE` → accepted.
- Any level punch via `source: REGULARIZATION` → bypasses check, accepted.
- `null` level (unclassified) → all sources accepted.
- Custom policy override (WORKER allowed WEB) → enforced after PUT.

---

## Build order

1. Schema (`attendance_source_policy`). `db:push`. Seed default rows for each level.
2. `getEmployeeLevel` used in `ingestPunch` guard.
3. Guard in `ingestPunch`. Update i18n key.
4. Routes + DTOs.
5. Tests.
