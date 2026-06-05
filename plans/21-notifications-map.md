# Plan 21 — Notification touchpoint map ("keeping the user in the loop")

Every place Avkash should proactively tell someone something. Built on the Phase 2/3
spine (`dispatch` → outbox → providers, idempotent + retried). One row per event;
adding one = a template in the registry + the domain emitting an intent at the right
moment.

**Legend.** Priority: 🔴 core loop (daily) · 🟡 useful · ⚪ later/optional.
Status: ✅ built · 🔨 building now · ◻ to do.
Default channel is EMAIL; SMS/Slack/in-app layer on per the provider seam + prefs.

## Recipient kinds

- **User** — has a `userId` (most events).
- **Email-only** — no account yet (invitations). Introduced the nullable-`userId`
  recipient; the outbox `to` is the real destination.

## Membership / Org — `@avkash/org`

| Event                     | Trigger                           | Recipient            | Pri | Status |
| ------------------------- | --------------------------------- | -------------------- | --- | ------ |
| `org.invitation.sent`     | someone is invited to an org/team | invitee (email-only) | 🔴  | 🔨     |
| `org.invitation.accepted` | invitee signs up                  | inviter + admins     | 🟡  | ◻      |
| `org.member.role_changed` | role updated                      | the member           | 🟡  | ◻      |
| `org.grace.expiring`      | trial/grace window ending soon    | owner + admins       | 🟡  | ◻      |
| `org.restricted`          | grace expired → org restricted    | owner + admins       | 🟡  | ◻      |

## Leave — `@avkash/leave` (the daily HR loop — highest value)

| Event                        | Trigger                         | Recipient                     | Pri | Status |
| ---------------------------- | ------------------------------- | ----------------------------- | --- | ------ |
| `leave.requested`            | employee applies                | approver(s) — manager / chain | 🔴  | ✅     |
| `leave.approved`             | approver approves               | requester                     | 🔴  | ✅     |
| `leave.rejected`             | approver rejects                | requester                     | 🔴  | ✅     |
| `leave.escalated`            | inline / SLA / manual           | HR / escalation target        | 🔴  | ✅     |
| `leave.cancelled`            | requester cancels               | approver                      | 🟡  | ◻      |
| `leave.balance.credited`     | accrual tick                    | user                          | 🔴  | ✅     |
| `leave.balance.adjusted`     | manual adjust / opening balance | user                          | 🟡  | ◻      |
| `leave.compoff.approved`     | comp-off granted                | user                          | 🟡  | ◻      |
| `leave.encashment.requested` | user requests encashment        | approver                      | 🟡  | ◻      |
| `leave.encashment.paid`      | encashment paid out             | user                          | 🟡  | ◻      |
| `leave.delegation.assigned`  | approver delegates approvals    | the delegate                  | 🟡  | ◻      |
| `leave.starting.reminder`    | day before leave starts         | user (+ team)                 | ⚪  | ◻      |

## Attendance — `@avkash/attendance`

| Event                                 | Trigger             | Recipient | Pri | Status |
| ------------------------------------- | ------------------- | --------- | --- | ------ |
| `attendance.regularization.requested` | user requests fix   | approver  | 🟡  | ◻      |
| `attendance.regularization.resolved`  | approver decides    | user      | 🟡  | ◻      |
| `attendance.absent`                   | no punch + no leave | manager   | ⚪  | ◻      |

## People — `@avkash/users`

| Event                      | Trigger                                | Recipient    | Pri | Status |
| -------------------------- | -------------------------------------- | ------------ | --- | ------ |
| `employee.profile.changed` | sensitive field edited by someone else | the employee | ⚪  | ◻      |

## Account / Auth — `@avkash/auth`

Email verification, password reset, phone OTP are **already** sent (Better Auth →
`sendEmail`/`sendSMS`, direct). They're request-tied and synchronous, so they stay
direct (not the outbox) by design. ✅

## Payroll — `@avkash/payroll` (future)

| Event                   | Trigger               | Recipient | Pri | Status |
| ----------------------- | --------------------- | --------- | --- | ------ |
| `payroll.payslip.ready` | payroll run finalized | employee  | ⚪  | ◻      |

## Suggested order

1. **`org.invitation.sent`** (now) — also proves email-only recipients.
2. **The leave approval loop** — `requested` → `approved`/`rejected` → `escalated`.
   This is the daily interaction; biggest value per event.
3. Org lifecycle (`role_changed`, `grace.expiring`, `restricted`).
4. Remaining leave events, then attendance, then the ⚪ reminders.
