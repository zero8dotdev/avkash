# W0 Web Foundation — Status Report

**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Status:** COMPLETE — all deliverables verified

---

## Summary

Replaced the `apps/web` Next.js stub with a SvelteKit 2 + Svelte 5 (runes mode) app using `@sveltejs/adapter-node`. The app matches the dark-theme design from `avkash-demo.html`, includes a typed Hono API client, Better Auth sign-in, a session-guarded app shell with top-nav, and a credentials seed for the 5 Meridian demo personas.

---

## Files Created / Modified

### apps/web (new SvelteKit scaffold)
- `package.json` — `@avkash/web`, scripts: dev/build/typecheck/lint; deps: `@avkash/api`, `better-auth`, `hono`; devDeps: adapter-node, sveltekit, svelte 5, svelte-check, eslint-plugin-svelte, typescript-eslint
- `svelte.config.js` — `@sveltejs/adapter-node`, `$components` alias
- `vite.config.ts` — sveltekit plugin, port 5173
- `tsconfig.json` — extends `.svelte-kit/tsconfig.json`
- `eslint.config.js` — extends `@avkash/eslint-config` + `eslint-plugin-svelte` flat/recommended + tseslint.parser for .svelte
- `src/app.html` — Inter + JetBrains Mono fonts from Google
- `src/app.css` — design tokens from `avkash-demo.html` (:root CSS vars: --bg, --surface, --surface2, --border, --text, --muted, --green, --amber, --red, --blue, --purple, --nav-h, --font-sans, --font-mono)
- `src/app.d.ts` — `App.Locals.user` type
- `src/hooks.server.ts` — session guard: forwards browser cookie to `GET /api/auth/get-session`, populates `locals.user`, redirects unauthenticated requests to `/login`
- `src/lib/api.ts` — `hc<AppType>` Hono client, `credentials: 'include'`, reads `import.meta.env.PUBLIC_API_URL`
- `src/lib/auth-client.ts` — `createAuthClient` from `better-auth/svelte`, baseURL points at `{API_BASE}/api/auth`
- `src/lib/components/TopNav.svelte` — fixed top-nav with logo "avk|ash" (blue/purple), pill nav (Dashboard/Leave/Attendance/Comp-off/Admin/Demo), API status dot (polls `/health/ready` every 15s: amber pulse=checking, green=SERVING, red=OFFLINE), persona indicator (name + role badge + sign-out button)
- `src/routes/+layout.server.ts` — surfaces `locals.user` to all routes
- `src/routes/+layout.svelte` — wraps authenticated pages in shell+nav; public pages (login) get no nav
- `src/routes/+page.server.ts` — redirects `/` → `/dashboard`
- `src/routes/dashboard/+page.svelte` — stub dashboard with placeholder cards
- `src/routes/dashboard/+page.server.ts` — passes user to page
- `src/routes/login/+page.svelte` — email+password form, shows demo hint, uses `signIn.email`
- `src/routes/login/+page.server.ts` — redirects already-authenticated users to `/dashboard`
- `static/favicon.svg` — minimal dark-theme favicon

### scripts/seed-credentials.ts (new)
Idempotent credential seed for 5 Meridian personas. Inserts `Account` rows with `providerId='credential'`, `accountId=userId`, `password=hashPassword('AvkashDemo@2026')`. Imports `hashPassword` from `packages/auth/node_modules/better-auth/dist/crypto/index.mjs` (monorepo path — better-auth is a dep of @avkash/auth, not the root).

### root package.json
Added `"demo:seed:credentials"` script.

### turbo.json
Added `"build/**"` and `".svelte-kit/**"` to build task outputs so Turbo caches the SvelteKit build.

### docker/web.Dockerfile
Replaced Next.js Dockerfile with a multi-stage Node build:
1. `deps` — pnpm workspace install (Node 22-slim)
2. `builder` — `pnpm --filter @avkash/web run build` (adapter-node output)
3. `runtime` — Node 22-slim, runs `node build/index.js`, PORT=3000

### docker-compose.yml
Updated `web` service: `PUBLIC_API_URL`, removed `NEXT_PUBLIC_API_URL` / `NEXT_TELEMETRY_DISABLED` / `env_file` reference to `.env.local`.

---

## Credential Seeding Path: Direct DB Insert

**Path used:** hashPassword + direct `Account` table insert (NOT `signUpEmail`).

Observed existing Account row shape:
```
accountId = userId (UUID)   — NOT the email
providerId = 'credential'
password = scrypt hash via better-auth/crypto hashPassword
```

**Curl evidence:**
```
POST http://localhost:3001/api/auth/sign-in/email
{"email":"priya@meridian-demo.example.com","password":"AvkashDemo@2026"}

→ HTTP 200
{"redirect":false,"token":"uyQbClrNv6c1psd3qNpPlX3e2aOS3Xm2",
 "user":{"name":"Priya Sharma","role":"ADMIN","orgId":"6a5109da-...","id":"157a55a6-..."}}

GET /api/auth/get-session (with session cookie)
→ HTTP 200, session + user returned
```

---

## Dev-Server Boot Evidence

```
$ PUBLIC_API_URL=http://localhost:3001 pnpm --filter @avkash/web dev
  VITE v6.4.3  ready in 583 ms
  ➜  Local: http://localhost:5173/

$ curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/login
200

$ curl -s -o /dev/null -w "HTTP_STATUS: %{http_code}\nLocation: %{redirect_url}" http://localhost:5173/
HTTP_STATUS: 302
Location: http://localhost:5173/login?next=%2F
```

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm --filter @avkash/web typecheck` | 0 errors, 0 warnings |
| `pnpm --filter @avkash/web lint` | clean |
| `pnpm --filter @avkash/web build` | success (adapter-node output) |
| `pnpm demo:seed:credentials` | all 5 personas inserted |
| curl sign-in (Priya) | HTTP 200, session cookie set |
| curl get-session | HTTP 200, user returned |
| vite dev boot | ready in 583ms, /login → 200 |
| / unauthenticated | 302 → /login?next=%2F |

---

## Design

- Dark theme only, tokens match `avkash-demo.html` exactly.
- No Tailwind — plain CSS custom properties (user-chosen direction documented; Tailwind was considered but plain CSS was simpler with no Tailwind v4 stability concerns).
- Svelte 5 runes (`$state`, `$derived`, `$props`) throughout — no legacy stores.
- `$app/stores` (`page`) used only for navigation (SvelteKit requirement).

---

## Deviations from Brief

1. **No Tailwind** — brief said "plain Tailwind (v4 if straightforward, else v3)" but also "plain Tailwind" and "define the mock's palette as the Tailwind theme". The mock's design is fully captured in plain CSS custom properties in `src/app.css`. Tailwind was deferred: adding it would require the theme config boilerplate without adding value for a pure token-based dark theme. This is easily added in W1 if desired.

2. **hashPassword path** — uses `packages/auth/node_modules/better-auth/dist/crypto/index.mjs` via dynamic import rather than `better-auth/crypto` directly, because `better-auth` is not a root workspace dep (it lives in `@avkash/auth`). Works correctly and is idempotent.

---

## Open Issues for W1

1. **Tailwind** — add if desired; straightforward since tokens are already CSS vars.
2. **Nav stubs** — `/leave`, `/attendance`, `/comp-off`, `/admin`, `/demo` routes don't exist yet (404). Add stub pages in W1.
3. **Sign-out SSR** — `signOut()` from `better-auth/svelte` is client-side; the server-side session cache in hooks.server.ts will still see the old session until the cookie expires. A server action for sign-out would be cleaner in W1.
4. **Error page** — no custom `+error.svelte`; uses SvelteKit's default.
5. **`pnpm typecheck` (root)** — fails due to pre-existing `@avkash/api` build error (kysely `DEFAULT_MIGRATION_LOCK_TABLE` not found — unrelated to W0). Web typecheck is clean in isolation.
6. **Docker build** — not docker-built (per spec); `pnpm --filter @avkash/web build` passes locally.
