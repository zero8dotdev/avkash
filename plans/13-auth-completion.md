# 13 — Completing Auth

Locked scope (2026-06-01). Four authN methods feeding one `AuthContext`; authz unchanged.

## Decisions

| #        | Decision                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Delivery | Email + SMS are **`console.log` stubs** for now (`@avkash/notifications`). Swap for Resend/MSG91 later, no caller changes. |
| Slack    | **Dropped for now** — Slack social provider + `authFromSlackUser` removed.                                                 |
| Google   | **Workspace `hd`-domains only**, enforced **server-side** (the `hd` URL param is a hint, not security).                    |
| Signup   | **Invite-only** — no public registration on any method.                                                                    |

## Methods → mechanism / assurance

| Method           | Better Auth                                                            | Assurance |
| ---------------- | ---------------------------------------------------------------------- | --------- |
| Email + password | `emailAndPassword` (`disableSignUp: true`, `requireEmailVerification`) | medium    |
| Phone + OTP      | `phoneNumber` plugin (`sendOTP` → console)                             | medium    |
| Google Workspace | `google` social provider + server-side hd check                        | high      |

Assurance is now 3 levels (`low | medium | high`). `requireAssurance('high')` gates sensitive
HR actions and steps up medium sessions.

## The one gate: `databaseHooks.user.create.before`

A single hook enforces **invite-only + provisioning + hd-domain** for _every_ method:

1. Look up a `PENDING` `Invitation` by email. None → reject (invite-only).
2. For Google sign-ins, assert the email domain ∈ `OrgDomain` for that org (hd enforcement).
3. Copy `role` / `orgId` / `teamId` from the invitation onto the new user.
4. `after` hook marks the invitation `ACCEPTED`.

This is why invite-only is clean: no user row is ever created without an invitation, regardless
of which method created it.

## Schema deltas (`@avkash/db`)

- `User` += `phoneNumber`, `phoneNumberVerified` (phone plugin).
- New `Invitation` (email, orgId, teamId, role, token, status, expiresAt, invitedBy).
- New `OrgDomain` (orgId, domain, verified) — allowed Google Workspace domains per org.

## Build phases

- **Phase 0** — notifications stubs, config env, mount `auth.handler` in `apps/api`, 3-level assurance. ✅ this pass
- **Phase 1** — email/password + verification/reset (console). ✅ this pass (config)
- **Phase 2** — phone + OTP (console). ✅ this pass (config)
- **Phase 3** — Google Workspace + hd check. ✅ this pass (config)
- **Next** — admin "create invitation" endpoint + accept UI; assurance step-up on sensitive actions; real Resend/MSG91.
