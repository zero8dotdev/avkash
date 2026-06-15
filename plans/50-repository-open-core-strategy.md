# Plan 50 — Repository & open-core strategy

Status: **architecture blueprint**. Defines how Avkash is split across GitHub for an **open-core** model:
a genuinely open-source **core** (public repo) plus proprietary **modules** (private repo), composed into a
single development workspace and two deployment targets (self-host OSS, managed SaaS).

Referenced by: [Plan 49 (modular core platform)](49-modular-core-platform.md) — this plan is the
repository/distribution counterpart to Plan 49's runtime architecture, and **amends** Plan 49's deferred
schema-ownership decision (see below). Amended by
[Plan 51 (granular authorization)](51-granular-authorization.md): `packages/authz` + the OpenFGA service
are **public** (open core); private modules ship their own FGA model fragments + field groups; the public
CI leak-guard grep extends to private FGA type names.

**Defaults baked into this plan** (override before execution if you disagree): **thick core** — the OSS
baseline is a genuinely useful free HRMS (platform + org/people + leave/attendance/holidays/policy), with
payroll/compliance/performance/etc. as the paid modules. **License: AGPL-3.0 + CLA** on the core. Both are
revisitable in *Open decisions*.

---

## The model: three independent dials

The Plan 49 module registry (the API is composed from a list of module manifests via `createApp(modules)`)
is what makes the open-core split clean — you compose **different module lists in different builds** without
forking core. That yields three orthogonal levers:

| Dial | Controlled by | Decides |
| --- | --- | --- |
| **Source visibility** | which repo a package lives in | open-source vs proprietary IP |
| **Build composition** | which manifests are in this build's `modules.ts` | what's compiled into a binary |
| **Runtime entitlement** | `org_entitlement` flag | what a given tenant can use |

Open-sourcing is just the first dial. A module can be: open + always-built + entitlement-gated (e.g. an
OSS module you still meter), or private + built-only-in-SaaS + entitlement-gated (e.g. payroll).

---

## Repository topology

**Why not a private branch:** GitHub visibility is per-*repository*, not per-branch — every branch of a
public repo is public. And a *private fork* means carrying a full copy of the public code and fighting merge
churn forever. The clean split is **two repos joined by a git submodule**, with the private repo embedding
the public one (not the reverse, so the open repo stays pristine and never references anything private).

### `avkash/avkash` — PUBLIC (the open core)

Self-hostable as the free product. Contains zero references to anything private.

```
apps/
  api/                # thin default server entry: createApp(OPEN_MODULES)
  web/                # Next.js app
packages/
  app/                # exports createApp(modules) — the factory both servers use
  shared/ config/ db/ i18n/ emails/      # foundation
  auth/                                   # identity (+ API keys)
  org/ users/                             # core people/tenant — always open
  events/ registry/ entitlements/         # the Plan 49 seams (open)
  leave/ attendance/ holidays/ policy/ documents/   # OSS HR baseline (thick core)
  notifications/ slack/ webhooks/         # delivery (event subscribers)
  tsconfig/ eslint-config/
LICENSE        # AGPL-3.0
CLA.md         # contributor license agreement (enforced by bot)
```

### `avkash/avkash-cloud` — PRIVATE (the commercial superset)

Embeds the public repo as a submodule and mounts private modules on top.

```
core/                       # git submodule → avkash/avkash  (pinned to a tag)
apps/
  cloud-api/                # SaaS server entry: createApp([...OPEN_MODULES, ...PRIVATE_MODULES])
  provider-admin/           # back-office: tenant + entitlement management, data export
packages/
  payroll/ compliance/ performance/ recruitment/ analytics/   # private modules (own their schema)
  billing/                  # Razorpay/Stripe → flips org_entitlement
  modules-private/          # PRIVATE_MODULES manifest list
drizzle.config.ts           # aggregates core schema + private module schema
pnpm-workspace.yaml         # globs core/* AND local packages/*, apps/*
LICENSE                     # proprietary
```

---

## Composition: the `createApp` factory (no build step, no publish)

The factory lives in a public package so both server entries consume it identically.

```ts
// PUBLIC  packages/app/src/index.ts
export function createApp(modules: AvkashModule[]): Hono {
  const app = new Hono().basePath('/v1');
  applyPlatformMiddleware(app);          // request-id, cors, locale, auth, etc.
  const registry = buildRegistry(modules);
  registry.mountRoutes(app);             // each gated by requireEntitlement(module.entitlement)
  registry.mergeI18n();
  return app;
}

// PUBLIC  apps/api/src/modules.ts
export const OPEN_MODULES: AvkashModule[] = [org, users, leave, attendance, holidays, policy, documents];

// PUBLIC  apps/api/src/server.ts   (the self-host binary)
createApp(OPEN_MODULES);

// PRIVATE  apps/cloud-api/src/server.ts   (the SaaS binary)
import { createApp } from '@avkash/app';
import { OPEN_MODULES } from '@avkash/api/modules';
import { PRIVATE_MODULES } from '@avkash/modules-private';
createApp([...OPEN_MODULES, ...PRIVATE_MODULES]);   // payroll, compliance, ...
```

Adding a private module = a new package in `avkash-cloud` + one line in `PRIVATE_MODULES`. **The public repo
never changes.** Subscribers (events) and jobs register the same way through each module's manifest, so
private modules react to core events without core importing them.

### Why this keeps your DX

The private `pnpm-workspace.yaml` globs **both** the submodule and local packages, so it is **one pnpm
workspace**:

```yaml
# avkash-cloud/pnpm-workspace.yaml
packages:
  - 'core/packages/*'
  - 'core/apps/*'
  - 'packages/*'
  - 'apps/*'
```

`@avkash/*` resolves to source across the repo boundary, `pnpm typecheck` stays authoritative across both,
and there is **no publish step and no build step** — the exact property you'd lose by publishing core to a
registry and depending on it. (That registry approach is the scale-later option; not needed now.)

---

## Schema across the boundary (amends Plan 49)

Plan 49 deferred relocating tables out of `packages/db`. **The open-core split forces that decision for
private modules** — if `db` is public, payroll/compliance tables cannot live there without leaking the shape
of paid features. Revised rule:

- **Open modules** may keep tables in public `packages/db` (organised per-file, as today).
- **Private modules own their own Drizzle schema** in their own package (`packages/payroll/src/schema.ts`),
  importing core tables (`organisation`, `user`) and column helpers from `@avkash/db`. Their relations
  co-locate there — **not** in the public `relations.ts`.
- Public `packages/db` exposes the client, core tables, `mapDatabaseError`, and the column/helper exports
  private modules need. This "schema-merge seam" becomes a **prerequisite** (it was optional in Plan 49).

Two drizzle configs, one per deploy target:

```ts
// PUBLIC  avkash/drizzle.config.ts        → self-host: core + open tables only
schema: ['./packages/db/src/schema/index.ts', './packages/*/src/schema.ts']

// PRIVATE avkash-cloud/drizzle.config.ts  → SaaS: core + open + private tables
schema: ['./core/packages/db/src/schema/index.ts', './core/packages/*/src/schema.ts', './packages/*/src/schema.ts']
```

---

## The open / closed line (thick core)

| Layer | OPEN (`avkash`) | PRIVATE (`avkash-cloud`) |
| --- | --- | --- |
| Foundation | shared, config, db, i18n, emails | — |
| Identity | auth (+ API keys) | — |
| Core domain | org, users | — |
| Platform seams | events, registry, entitlements | — |
| HR modules | leave, attendance, holidays, policy, documents | payroll, compliance, performance, recruitment, analytics |
| Delivery | notifications, slack, webhooks | — |
| Billing / ops | — | billing, provider-admin |
| Server entry | `apps/api` (open modules) | `apps/cloud-api` (all modules) |

Rationale for thick core: a free product nobody can run is not a funnel. The OSS baseline must be a working
HRMS (people + leave + attendance + holidays) so adoption is real; monetise the modules a *company* graduates
into (payroll, statutory compliance, performance). The entitlements service itself is **open** so self-hosters
can gate/meter too — only the proprietary modules it switches on are private.

---

## Licensing & contributions

- **Core: AGPL-3.0.** Network-use copyleft deters a competitor reselling your core as a SaaS while keeping it
  genuinely OSI-open. Self-hosters who modify and offer it over a network must publish their changes.
- **CLA required on the public repo** (CLA Assistant bot blocks merge until signed; DCO is the lighter
  alternative). This is non-negotiable for open-core: without assigned/ licensed contribution rights you
  **cannot** dual-license — i.e. offer the core under a commercial license to an enterprise that refuses
  AGPL. The CLA is what lets you sell a license exception.
- **Private modules: proprietary**, standard commercial license; never published.

---

## GitHub mechanics

**CI split:**

| | Public `avkash` | Private `avkash-cloud` |
| --- | --- | --- |
| Checkout | core only | `--recurse-submodules` |
| Steps | install · lint · typecheck · test (core) | install · typecheck (full) · test (full) · build SaaS image |
| Must be green without private code | ✅ (hard requirement) | n/a |
| Secrets | none | deploy · billing · provider |

- **Secrets** live only in the private repo. The public repo holds none.
- **Releases & pinning:** public repo tags core releases (semver); the private submodule pins to a **tag**
  (never floating `main`). "Upgrade core" = one PR bumping the submodule pointer (`git submodule update
  --remote`), reviewed deliberately.
- **Access:** private repo restricted to the org team; branch protection + required reviews on both.
- **Leak guards:** a public-CI check (grep) asserting no private module keys/table names appear in the public
  repo; separate git remotes so private code can't be pushed to the public origin.

**Deploy targets:**

- **Self-host / OSS** — image built from `avkash`, runs `apps/api` with open modules + the core drizzle
  config (see [Plan 11 Coolify self-host](11-coolify-selfhost-deployment.md)).
- **SaaS** — image built from `avkash-cloud`, runs `apps/cloud-api` with all modules + the aggregated drizzle
  config; entitlements decide per tenant.

**Developer workflow:**

- OSS contributor: `git clone avkash && pnpm i && pnpm dev` → core + open modules.
- SaaS dev: `git clone --recurse-submodules avkash-cloud && pnpm i && pnpm dev` → everything in one
  workspace. Editing core = commit inside `core/` (pushes to public), then bump the pointer in `avkash-cloud`.
  Provide a `pnpm sync:core` script to reduce submodule friction.

---

## Risks & mitigations

- **Submodule friction** → pin to tags, script the sync flow, keep core upgrades to deliberate PRs.
- **Schema/IP leakage** → enforce module-owned private schema; CI grep guard in the public repo.
- **`createApp` contract drift** → treat the factory + manifest interface as a semver'd public API; the
  private repo pins a core tag and upgrades on its own cadence.
- **Accidental private→public push** → distinct remotes, branch protection, optional pre-push hook.
- **AGPL enterprise aversion** → the CLA enables a commercial license exception; offer it as part of the
  paid tier.

---

## Definition of done

- A fresh clone of the **public** repo runs the open product (self-host) with **no private access**.
- A clone of the **private** repo (with submodule) runs the full SaaS in **one workspace, no build step**.
- Adding a private module touches **only** the private repo (new package + one line in `PRIVATE_MODULES`).
- Upgrading core is a **single submodule-pointer PR** in the private repo.
- Public CI is green **without** any private code present.

---

## Open decisions

- Borderline modules: keep `documents` and basic `analytics`/reports open, or move to paid?
- License posture: **resolved as AGPL-3.0 + CLA** for the public core, with commercial license exceptions
  available through the CLA-backed dual-license path.
- CLA tooling: CLA Assistant vs DCO sign-off.
- Private modules: one private repo (recommended to start) vs one repo per module (later, if teams diverge).
- When to migrate off submodules to **published versioned packages** (only when team/scale forces clean
  version boundaries).
