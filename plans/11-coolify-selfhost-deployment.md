# 11 — Coolify + Self-Hosted Supabase Deployment Plan

**Scope:** Deploy the *current* Avkash codebase (Next.js 15 + Supabase) to a self-managed VPS using
[Coolify](https://coolify.io) as the PaaS layer and Supabase's self-hosted stack as the backend.
This is a **lift-and-self-host** of the existing app — **not** the future Bun/Postgres rewrite
described in `09-migration-supabase.md`. Treat this as a stopgap / cost-saving / data-residency
deployment of what exists today.

> **Reality check before you start:** the single hardest part of this is **not** Coolify and **not**
> the app — it is reproducing **Supabase Auth (GoTrue) with the Slack OIDC provider** and keeping the
> JWT secret consistent so that the existing RLS policies (which call `auth.uid()`, `auth.role()`)
> keep working. Budget most of your debugging time there. Everything else is routine.

### Decisions (locked 2026-05-30)

| Question | Decision | Consequence for this plan |
|---|---|---|
| **v1 scope** | **Login + leave management only** | Razorpay billing and the Slack *install* flow are **deferred/stubbed**. Skip §7 Razorpay/Slack-install wiring for v1; keep the code paths but feature-off. Reduces required secrets (no `RAZORPAY_*` needed to launch). |
| **Longevity** | **Long-term home** | Invest fully in backups, monitoring, Studio lockdown, and fixing hardcoded values (§5, §8). Don't cut corners "because it's temporary." |
| **Data** | **Fresh / empty DB** | No `auth.users` migration. Skip §4.4 sample-data load. New orgs sign up clean via Slack OIDC. Simplest auth path. |
| **Auth model** | Slack-OIDC-only (implied by scope) | SMTP still configured for GoTrue stability + contact form, but no email/password or magic-link flow to build. |

**Still needed from you:** the **apex domain** (drives every URL below). Placeholder `example.com` used throughout — find/replace once chosen.

---

## 0. Target Architecture

```
                         ┌─────────────────────────────────────────────┐
   Internet  ──TLS──▶    │  VPS (Hetzner CPX31 / similar, Docker host)  │
                         │                                             │
                         │   ┌─────────────┐                           │
                         │   │   Coolify    │  (orchestrator + proxy)   │
                         │   │  Traefik/     │  Let's Encrypt TLS        │
                         │   │  Caddy proxy │                           │
                         │   └──────┬───────┘                           │
                         │          │ routes by subdomain               │
                         │   ┌──────┴──────────────────────────────┐    │
                         │   │                                     │    │
                         │   ▼                                     ▼    │
                         │  app.example.com              supabase.example.com (Kong)
                         │  ┌────────────────┐           ┌──────────────────────────┐
                         │  │ Avkash         │           │ Supabase stack (compose) │
                         │  │ Next.js 15     │──internal▶│  Kong  ─ GoTrue (auth)    │
                         │  │ (node server)  │  network  │        ─ PostgREST        │
                         │  └────────────────┘           │        ─ Postgres 15      │
                         │                               │        ─ Storage          │
                         │  studio.example.com ─────────▶│        ─ Studio (gated)   │
                         │                               │        ─ Realtime/Meta    │
                         │                               └──────────────────────────┘
                         └─────────────────────────────────────────────┘
```

**Domains needed (3 subdomains, 1 apex optional):**

| Subdomain | Routes to | Public? |
|---|---|---|
| `app.example.com` | Avkash Next.js app | Yes |
| `supabase.example.com` | Supabase Kong gateway (the API URL the app + browser use) | Yes |
| `studio.example.com` | Supabase Studio (DB admin UI) | Yes, **but behind HTTP basic-auth / IP allowlist** |

> The browser-side Supabase client uses `NEXT_PUBLIC_SUPABASE_URL`, so the Supabase API **must** be
> reachable from end-user browsers over public TLS. `supabase.example.com` cannot be internal-only.

---

## 1. Prerequisites & Sizing

### VPS sizing

| Load | Spec | Example |
|---|---|---|
| Eval / small team | 4 vCPU, 8 GB RAM, 80 GB SSD | Hetzner CPX31 (~€15/mo) |
| Production (1–50 orgs) | 4–8 vCPU, 16 GB RAM, 160 GB SSD | Hetzner CPX41 / CCX23 |

The full Supabase stack (~10 containers) + Next.js + Coolify itself is RAM-hungry. **Do not go below
8 GB.** Postgres + GoTrue + PostgREST + Kong + Realtime + Storage + Studio + Meta + analytics
(Logflare/Vector — can be disabled) add up fast.

### Accounts / things to have ready

- A domain you control + access to its DNS.
- VPS provider account (Hetzner recommended for price/EU; DigitalOcean/Vultr fine).
- SSH key.
- Slack app credentials (client id + **client secret** — currently missing, see §5).
- Razorpay account keys + webhook secret (if billing is in scope; can be deferred).
- An SMTP provider for transactional email (Resend/Postmark/Brevo/Gmail app password). Needed for
  both **GoTrue auth emails** and the **contact form**.
- Generate secrets locally now (you'll paste them into Coolify):
  ```bash
  # JWT secret (>= 32 chars) — the root of all Supabase keys
  openssl rand -hex 32
  # Postgres password
  openssl rand -hex 24
  # Dashboard password, anon/service keys are derived from JWT secret (see §3.2)
  ```

---

## 2. Phase A — Provision VPS & Install Coolify

1. Create the VPS (Ubuntu 22.04/24.04 LTS). Add your SSH key. Enable the provider firewall:
   allow **22, 80, 443** inbound.
2. Point DNS **A records** at the VPS IP:
   - `app.example.com` → VPS IP
   - `supabase.example.com` → VPS IP
   - `studio.example.com` → VPS IP
   - (optional) `coolify.example.com` → VPS IP for the Coolify dashboard itself
3. SSH in and install Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
4. Open `http://<VPS-IP>:8000`, create the admin account, and (recommended) set
   `coolify.example.com` as the instance domain so the dashboard itself gets TLS.
5. In Coolify, confirm the **Localhost** server is connected and Docker is healthy.

**Hardening (do now, not later):**
- `ufw` (or provider firewall) — only 22/80/443. Coolify's proxy handles the rest internally.
- Disable password SSH; key-only.
- Create a non-root sudo user if the provider gave you root.

---

## 3. Phase B — Deploy Self-Hosted Supabase

You have two viable routes. **Route 1 is recommended** for production reproducibility.

### Route 1 (recommended): Supabase one-click service in Coolify
Coolify ships a **Supabase** service template. In Coolify:
1. **Projects → New → Service → Supabase**.
2. Attach it to a resource group and set the domain to `supabase.example.com` (this becomes the Kong
   gateway / public API URL).
3. Before first deploy, set the service environment (see §3.2). Deploy.

### Route 2: Bring the official `docker/docker-compose.yml`
Clone Supabase's official self-hosting compose into a Coolify **Docker Compose** resource. More
control (pin versions, disable analytics), more manual wiring. Use this if the template lags upstream
or you need to trim containers.

### 3.1 Trim what you don't use
The codebase uses **only Postgres + Auth (GoTrue) + PostgREST**. It does **not** use Supabase
Storage, Realtime, or Edge Functions (verified — no `.storage()`, no `.on('postgres_changes')`, no
`.functions.invoke()` anywhere). To save RAM you *may* disable:
- `storage-api` + `imgproxy`
- `realtime`
- `edge-runtime` / functions
- `analytics` (Logflare) + `vector` — these are the heaviest and most failure-prone; safe to drop.

Keep: `db` (Postgres), `auth` (GoTrue), `rest` (PostgREST), `kong` (gateway), `meta` + `studio`
(for admin), `supavisor`/pooler if present.

> If you keep Studio, you keep Meta. If you disable analytics, make sure Studio/Kong env doesn't
> hard-depend on the analytics container or the stack won't come up — a common self-host gotcha.

### 3.2 Critical Supabase env vars
These must be set **before first boot** and never changed casually (changing `JWT_SECRET` invalidates
all issued keys/sessions and breaks the app):

| Var | Value | Notes |
|---|---|---|
| `POSTGRES_PASSWORD` | from `openssl rand` | superuser password |
| `JWT_SECRET` | 32-byte secret | **root of trust** for anon/service keys |
| `ANON_KEY` | JWT signed with `JWT_SECRET`, role `anon` | → app's `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SERVICE_ROLE_KEY` | JWT signed with `JWT_SECRET`, role `service_role` | → app's `SUPABASE_SERVICE_ROLE_KEY` |
| `SITE_URL` | `https://app.example.com` | GoTrue redirect base |
| `API_EXTERNAL_URL` | `https://supabase.example.com` | public Kong URL |
| `SUPABASE_PUBLIC_URL` | `https://supabase.example.com` | Studio/Kong |
| `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` | your choice | Studio basic-auth |
| `DISABLE_SIGNUP` | `false` (or `true` if invite-only) | see auth model below |
| `SMTP_*` | provider creds | GoTrue auth emails (see §3.4) |

> **Generating ANON_KEY / SERVICE_ROLE_KEY:** they are JWTs signed with `JWT_SECRET`. Use Supabase's
> documented generator (the self-hosting docs page has an inline tool) or a small Node script with
> `jsonwebtoken` using payloads `{ role: "anon", iss: "supabase", iat, exp }` and
> `{ role: "service_role", ... }`. Coolify's Supabase template can auto-generate these — if so, copy
> the produced values; you'll paste them into the **app's** env in §6.

### 3.3 ⭐ Slack OIDC provider (the make-or-break step)
The app's primary login is **Slack via Supabase Auth** (`signInWithOAuth({ provider: 'slack_oidc' })`
in `src/app/(public)/login/withSlack.tsx`). Self-hosted GoTrue supports Slack OIDC through env vars
on the **auth** container:

```
GOTRUE_EXTERNAL_SLACK_OIDC_ENABLED=true
GOTRUE_EXTERNAL_SLACK_OIDC_CLIENT_ID=<slack app client id>
GOTRUE_EXTERNAL_SLACK_OIDC_SECRET=<slack app client secret>
GOTRUE_EXTERNAL_SLACK_OIDC_REDIRECT_URI=https://supabase.example.com/auth/v1/callback
```
(Exact var names depend on the GoTrue version — confirm against the running image's docs; older
images use `SLACK` vs `SLACK_OIDC`. Verify with `docker exec` + the GoTrue README for your tag.)

Then, in the **Slack app config** (api.slack.com/apps), add the redirect URL
`https://supabase.example.com/auth/v1/callback` to **OAuth & Permissions → Redirect URLs**.

> **Test login end-to-end early** (right after the DB is seeded in §4). If Slack OIDC isn't wired
> correctly, *nothing* in the authenticated app works, and RLS will reject everything because
> `auth.uid()` is null.

### 3.4 SMTP for GoTrue
Even with OIDC login, configure SMTP so password/magic flows and admin emails work. Set
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_NAME`, `SMTP_ADMIN_EMAIL` on the
auth container. Without OIDC-only enforcement, leaving SMTP unset can cause signup endpoints to 500.

---

## 4. Phase C — Initialize the Database Schema

**Decide one source of truth.** The repo has *two* overlapping mechanisms:
- `supabase/migrations/` — 6 timestamped Supabase CLI migrations (git-tracked, reproducible).
- `db/` raw scripts run by `db/setup.js` via `pnpm setup` (tables → seeds → functions → triggers →
  policies). `db/tables/tables.sql` **drops and recreates** everything.

> ⚠️ Do **not** run both against the same DB blindly — `db/tables/tables.sql` is destructive and the
> migrations may overlap. Pick **one**:
> - **Recommended for a fresh self-host:** run the `db/` scripts (they're the maintained dev path and
>   include seeds + RLS), then treat future changes as new `supabase/migrations`.
> - **Or** use `supabase db push`/migrations exclusively if you want CLI-managed history.

### 4.1 Get a direct Postgres connection
The setup scripts connect via `SUPABASE_DIRECT_URL` (port 5432 inside the stack). For a one-time run
from your laptop you need to reach Postgres. Options:
- Temporarily expose Postgres on the VPS firewall (5432) — **then close it** after.
- Or SSH-tunnel: `ssh -L 5432:localhost:5432 user@vps` and point the URL at `localhost`.
- Or run the setup **inside** the VPS / a one-off container on the Supabase docker network.

Connection string shape:
```
SUPABASE_DIRECT_URL=postgresql://postgres:<POSTGRES_PASSWORD>@<host>:5432/postgres
```

### 4.2 Run the schema (ordered — order matters)
```bash
# from a checkout of the repo, with .env.local containing SUPABASE_DIRECT_URL
pnpm install
pnpm tables       # db/tables/tables.sql   (DROPS + recreates all tables/enums)
pnpm seeds        # db/seed/seeds.sql       (public holidays + seed)
pnpm functions    # db/functions/*.sql      (fetch_user_role/orgid/teamid, accruals, grants)
pnpm triggers     # db/triggers/*.sql       (11 audit/business triggers)
pnpm policies     # db/policies/**/*.sql     (24 RLS policies + enable_rls.sql)
# or: pnpm setup   (runs all of the above in sequence)
```

### 4.3 Verify auth coupling
The RLS policies call helper functions that read `auth.uid()`:
`fetch_user_role(auth.uid())`, `fetch_user_orgid(auth.uid())`, `fetch_user_teamid(auth.uid())`.
These require:
1. GoTrue's `auth` schema + `auth.uid()` function to exist (provided by the Supabase Postgres image —
   **not** a vanilla Postgres). Confirm `select auth.uid();` resolves.
2. A row in the app's `User` table whose id matches the authenticated `auth.users.id`. The signup /
   first-login flow must create this mapping — verify it does after first Slack login.

### 4.4 (Skipped — fresh DB) Sample data
**Decision: fresh/empty DB**, so do **not** load `data_dump.sql`. (For reference: it's data-only
INSERTs — `auth.users` + `User` + leaves + orgs/teams from a dev environment, with real-looking dev
OAuth metadata. Not for production.) First real org is created by the first Slack OIDC login +
in-app onboarding. You may load it into a **scratch DB** only to smoke-test the schema before going
live, then drop it.

---

## 5. Phase D — Pre-Deploy Code Fixes (do BEFORE building the app)

The audit surfaced hardcoded values and broken/missing config. Fix these or production breaks. Each
is a small, contained change:

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | Slack client ID **hardcoded** | `src/app/welcome/install-to-slack/route.tsx` (+ login) | Move `6356258938273...` to `NEXT_PUBLIC_SLACK_CLIENT_ID`, read from env |
| 2 | `SLACK_CLIENT_SECRET` **undefined** | OAuth token exchange | Set in env; required or Slack install fails |
| 3 | `RAZORPAY_URL` **undefined** | `api/checkout`, invoices | **v1: stub/feature-off billing** (out of scope). Ensure checkout/webhook routes fail closed or are hidden; revisit when billing is in scope |
| 4 | Contact SMTP creds **hardcoded empty** | `src/app/api/contact/route.ts` | Read `SMTP_USER`/`SMTP_PASS` from env; currently emails silently fail |
| 5 | Contact recipient hardcoded | `api/contact/route.ts` | Parameterize `rohit@zero8.dev` if needed |
| 6 | reCAPTCHA sitekey hardcoded, secret unused | contact form | Move sitekey to env; add server-side verify if you want real protection |
| 7 | Image domains | `next.config.mjs` | `lh3.google.com` / `gstatic` — keep; add your Slack/avatar CDN if used |
| 8 | Dev HTTPS hack | `package.json` `dev` script | Irrelevant in prod (`next start`), but don't ship `NODE_TLS_REJECT_UNAUTHORIZED=0` into runtime |
| 9 | `@vercel/analytics` | `layout.tsx` | No-op off Vercel; harmless. Remove if you want zero external calls |

> **v1 scope is login + leave management** — so **feature-flag/stub** Razorpay and the Slack *install*
> flow now. You still ship Slack OIDC **login**, leave management, and the calendar feed. Keep the
> billing/install code in place but gated, so re-enabling later is a config change, not a rewrite.

**Build target:** the app uses plain `next build` + `next start` (no `output: 'standalone'`).
Coolify's **Nixpacks** builder handles Next.js out of the box. Optionally add a `Dockerfile` with
`output: 'standalone'` for smaller images — not required.

---

## 6. Phase E — Deploy Avkash on Coolify

1. **Projects → New → Application → Public/Private Git Repository.** Connect the repo, pick branch.
2. **Build pack:** Nixpacks (auto-detects pnpm + Next.js). Set:
   - Install: `pnpm install --frozen-lockfile`
   - Build: `pnpm build`
   - Start: `pnpm start` (Coolify sets `PORT`; Next respects it)
   - Node 20+ (matches `engines.node >= 20`).
3. **Domain:** `app.example.com` (Coolify provisions Let's Encrypt TLS automatically).
4. **Environment variables** (mark secrets as such; `NEXT_PUBLIC_*` are build-time → set them as
   build env so they're inlined):

   ```
   # Supabase (from §3.2)
   NEXT_PUBLIC_SUPABASE_URL=https://supabase.example.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
   SUPABASE_DIRECT_URL=postgresql://postgres:<pw>@<internal-db-host>:5432/postgres

   # App URLs / OAuth
   NEXT_PUBLIC_REDIRECT_URL=https://app.example.com/
   NEXT_PUBLIC_REDIRECT_PATH_AFTER_OAUTH=welcome
   NEXT_PUBLIC_SLACK_CLIENT_ID=<slack client id>
   SLACK_CLIENT_SECRET=<slack client secret>

   # Razorpay (or stub)
   RAZORPAY_KEY_ID=<...>
   RAZORPAY_KEY_SECRET=<...>
   RAZORPAY_WEBHOOK_SECRET=<...>
   RAZORPAY_URL=https://api.razorpay.com/v1/

   # SMTP for contact form
   SMTP_USER=<...>
   SMTP_PASS=<...>
   ```

   > **Gotcha:** `NEXT_PUBLIC_*` vars are baked at **build time**. If you change the Supabase URL or
   > anon key later, you must **rebuild**, not just restart.

   > **Internal vs public Supabase URL:** the browser needs the public `https://supabase.example.com`.
   > Server-side calls can use the same public URL (simplest) or an internal docker network address
   > if the app and Supabase share a Coolify network. Start with the public URL everywhere; optimize
   > later.

5. Deploy. Watch logs for a clean `next start`. Hit `https://app.example.com`.

---

## 7. Phase F — Wire External Services to Public URLs

| Service | Configure at | Set to |
|---|---|---|
| **Slack OIDC redirect** | Slack app → OAuth & Permissions → Redirect URLs | `https://supabase.example.com/auth/v1/callback` |
| **Slack install redirect** | same | `https://app.example.com/welcome/install-to-slack` |
| **Slack bot scopes** | Slack app → OAuth scopes | (already enumerated in code: `chat:write`, `commands`, `users:read.email`, `channels:history`, etc.) |
| **Slack slash commands / events** | Slack app → Slash Commands / Event Subscriptions | point at the relevant `https://app.example.com/api/slack/...` routes |
| **Razorpay webhook** | Razorpay dashboard → Webhooks | `https://app.example.com/api/rpay-webhooks` (HMAC-SHA256, `x-razorpay-signature`) |
| **Calendar feed** | (no config — it's an output) | `https://app.example.com/api/{orgId}/{teamId}/calendarfeed?userId=...` (public, no auth) |
| **GoTrue Site URL / redirects** | Supabase auth env | `https://app.example.com` + allowed redirect list |

> Audit the `src/app/api/slack/` routes for the exact slash-command/interactivity/events paths and
> register each in the Slack app. (Slack also needs a **Signing Secret** if those routes verify
> request signatures — confirm and add `SLACK_SIGNING_SECRET` if referenced.)

---

## 8. Phase G — Backups, Secrets, Monitoring

**Backups (non-negotiable — this is the #1 thing people skip and regret):**
- Postgres logical backup cron: `pg_dump` to off-box storage (S3/R2/Backblaze) daily + retention.
  Add as a Coolify **Scheduled Task** or a sidecar cron container.
- VPS-level: provider volume snapshots (Hetzner/DO daily snapshots) as a second line.
- **Test a restore** at least once. An untested backup is not a backup.

**Secrets:**
- All secrets live in Coolify's env store (encrypted at rest). Never commit `.env*`.
- Keep `JWT_SECRET`, `SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD` in a password manager too — losing
  `JWT_SECRET` means re-issuing all keys + re-login for everyone.

**Monitoring:**
- Coolify has built-in container health + restart. Enable email/Slack notifications on deploy/health.
- Uptime: external monitor (UptimeRobot/BetterStack) on `app.example.com` + `supabase.example.com`.
- Disk: Supabase + Postgres WAL + logs grow; alert at 70% disk. Disabling Logflare/Vector helps a lot.
- Errors: optional Sentry (not currently integrated).

**Studio lockdown:**
- Keep `studio.example.com` behind Coolify basic-auth and/or an IP allowlist. It is full DB admin.

---

## 9. Verification Checklist (smoke tests)

Run top-to-bottom after deploy; each gates the next:

- [ ] `https://app.example.com` loads (public marketing/login).
- [ ] `https://supabase.example.com/rest/v1/` responds (Kong up); Studio reachable + gated.
- [ ] `select auth.uid();` and `select fetch_user_role('<uuid>');` resolve in Postgres.
- [ ] **Slack OIDC login** completes → lands on `welcome` → a `User` row is created/linked.
- [ ] Authenticated dashboard loads data (proves RLS + `auth.uid()` path works end-to-end).
- [ ] `/dashboard` → `/dashboard/timeline` redirect (308) works.
- [ ] Create/approve a leave request → triggers fire, audit rows written.
- [ ] Calendar feed URL returns a valid `.ics`.
- [ ] (if in scope) Razorpay test webhook → signature verified → `Subscription` row updated.
- [ ] (if in scope) Contact form sends email via SMTP.
- [ ] Kill a container → Coolify restarts it; app recovers.
- [ ] Run a `pg_dump` backup and **restore it to a scratch DB**.

---

## 10. Risks, Gotchas & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Slack OIDC not supported/misconfigured in self-hosted GoTrue version | **High** | Pin a GoTrue tag known to support Slack OIDC; test login before anything else; fall back to email magic-link if blocked |
| `auth.uid()` null → RLS rejects everything | High | Verify auth schema + User-row mapping early (§4.3) |
| Changing `JWT_SECRET`/keys after launch invalidates sessions & app keys | High | Set once, store safely, never rotate casually |
| `NEXT_PUBLIC_*` baked at build → stale after env change | Medium | Rebuild (not restart) when public env changes |
| `db/tables/tables.sql` is destructive | Medium | Never re-run against a populated prod DB; use migrations after initial setup |
| Self-host stack RAM exhaustion (OOM kills Postgres) | Medium | 8–16 GB RAM; disable analytics/realtime/storage/functions |
| Analytics (Logflare/Vector) container fails the whole stack | Medium | Disable it; ensure Studio/Kong don't hard-depend on it |
| No backups when disk dies | High impact | Daily `pg_dump` off-box + snapshots + tested restore |
| Public calendar feed leaks leave data (no auth) | Low/Medium | Accept (existing behavior) or add a signed token before exposing publicly |
| SMTP unset → GoTrue signup 500s / contact form silently fails | Medium | Configure SMTP in §3.4 + §5 |
| Single VPS = single point of failure | Medium | Snapshots + documented rebuild; HA is out of scope for v1 |

---

## 11. Cost Estimate (monthly)

| Item | Est. |
|---|---|
| Hetzner CPX31/CPX41 VPS | €15–30 |
| Domain | ~€1 (amortized) |
| Off-box backup storage (R2/B2) | ~€1–5 |
| SMTP (Resend/Brevo free tier → paid) | €0–20 |
| **Total** | **~€20–55/mo**, vs Supabase Cloud Pro (~$25) + Vercel (~$20) + scaling |

Self-hosting wins on cost and data residency; you pay in **ops time** (backups, upgrades, incident
response) and the GoTrue/OIDC setup friction.

---

## 12. Execution Order (TL;DR)

1. Provision VPS + DNS + Coolify (§2).
2. Deploy Supabase stack; set JWT/keys/URLs; **wire Slack OIDC + SMTP** (§3).
3. Initialize schema via `pnpm setup` against direct Postgres; verify `auth.uid()` path (§4).
4. Apply pre-deploy code fixes (env-ize hardcoded values, fix SMTP/Razorpay) (§5).
5. Deploy Avkash app on Coolify with full env; rebuild for `NEXT_PUBLIC_*` (§6).
6. Register Slack/Razorpay/GoTrue redirect + webhook URLs (§7).
7. Backups + secrets + monitoring + Studio lockdown (§8).
8. Run the verification checklist; don't call it done until restore is tested (§9).

---

## Decisions Resolved & Remaining

**Resolved (2026-05-30):**
- ✅ **Scope v1:** login + leave management only; Razorpay billing + Slack install flow stubbed.
- ✅ **Longevity:** long-term home — invest fully in backups/monitoring/hardening.
- ✅ **Data:** fresh/empty DB — no Supabase-cloud data migration.
- ✅ **Auth model:** Slack-OIDC-only (SMTP still configured for GoTrue + contact form).

**Remaining before execution:**
1. **Domain** — choose the apex domain; find/replace `example.com` throughout. *(Only true blocker.)*
2. **Slack app** — obtain the **client secret** (currently missing) and confirm the app can be
   reconfigured with new redirect URLs, or create a fresh Slack app for the self-hosted instance.
3. **GoTrue image tag** — verify the chosen Supabase/GoTrue version exposes Slack OIDC env vars
   (`*_SLACK_OIDC_*`); pin it. Test login first (§3.3) before building anything else.
