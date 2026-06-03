# Plan 17 — Approval escalation

Status: design locked. Goal: when a manager doesn't act (or a leave is severe), loop in HR —
reusing the approval/comment/authz machinery that already exists.

## Decisions (locked)

- **HR = the `ADMIN` role** (org-wide). First approver of a team = `team.managers[]`.
- **Semantics: notify-only.** Escalation flags the leave + notifies HR; HR approves via the
  existing `canApprove` (OWNER/ADMIN approve anywhere) — the manager is NOT removed. No new authz.
- **Triggers** (a leave escalates if any fire):
  - **Time / SLA** — PENDING longer than `escalateAfterDays`. _On by default_ (resolves to 3).
  - **Severity** — workingDays > `LeavePolicy.escalateOverDays`. _Off by default_ (null).
  - **Type** — `LeaveType.alwaysEscalate`. _Off by default_ (false).
  - **Manual** — `POST /leaves/:id/escalate`, always available.
- **Target (who) — `Team.escalatesTo`** (a designated HR user); resolves `team.escalatesTo → all
org ADMINs`. Per-team so a multi-outlet brand routes Branch-A→HR-North, Branch-B→HR-South.
- **When (how long) — `escalateAfterDays`** resolves `team → org → 3`; `0` = off (e.g. the
  HR-managed core team).

## Config homes (each knob where it belongs — no new EscalationPolicy table)

| Knob                         | Table                         | Default           |
| ---------------------------- | ----------------------------- | ----------------- |
| `escalateAfterDays`          | Organisation + Team (cascade) | 3 (system const)  |
| `escalatesTo`                | Team                          | null → all ADMINs |
| `escalateOverDays`           | LeavePolicy                   | null (off)        |
| `alwaysEscalate`             | LeaveType                     | false             |
| `escalatedAt`, `escalatedTo` | Leave (the record)            | null              |

## Mechanism

- **Severity + type** → evaluated **inline in `applyLeave`** (born escalated, HR notified now).
- **Time SLA** → **cron** `runEscalations()` on `/internal` (token-guarded): PENDING + not yet
  escalated + age > resolved `escalateAfterDays` → escalate. Daily. SLA in **calendar days**
  (keeps the workweek engine out of the cron; default 3 absorbs a weekend).
- **escalateLeave(leaveId, reason)** is the one action: set `escalatedAt`/`escalatedTo`, post a
  SHARED comment ("Escalated to HR: …"), notify the target (escalatesTo, else all ADMINs).

## Build sequence

1. Schema: the 6 columns above. `db:push` (additive).
2. `resolveEscalation(teamId)` → `{ afterDays, targetUserId | null }` (the cascade).
3. `escalateLeave` + notify + comment.
4. Inline severity/type check in `applyLeave`.
5. `runEscalations()` cron + `POST /internal/escalations`.
6. `POST /leaves/:id/escalate` (manual).
7. Team escalation config (`escalateAfterDays`, `escalatesTo`) + org `escalateAfterDays` setters/routes.
