# WS1 Report — Infra + @avkash/authz client

**Status:** DONE  
**Branch:** plan51/ws1-authz-infra-v2  
**Agent model:** claude-sonnet-4-6

---

## Files touched

| File | Change |
|------|--------|
| `docker-compose.yml` | Added `openfga-db-init`, `openfga-migrate`, `openfga` services |
| `packages/config/src/index.ts` | Added `FGA_API_URL` (default `http://localhost:8080`) and `FGA_STORE_ID` (optional) |
| `packages/authz/package.json` | New package `@avkash/authz` |
| `packages/authz/tsconfig.json` | New tsconfig extending base |
| `packages/authz/src/index.ts` | Public exports |
| `packages/authz/src/client.ts` | `AuthzClient` implementation (check, requireRelation, listAccessible, explainAccess, writeTuples, setStoreId) |
| `packages/authz/src/store.ts` | `ensureStore(name)` — find-or-create FGA store at boot |
| `packages/authz/src/health.ts` | `authzHealthy(timeoutMs)` — liveness probe |
| `packages/authz/src/client.test.ts` | 14 unit tests with stubbed SDK |
| `apps/api/src/app.ts` | `/health/ready` now probes FGA alongside DB ping |
| `apps/api/package.json` | Added `@avkash/authz: workspace:*` dependency |

---

## Design decisions and deviations

**Null userId handling.** `AuthContext.userId` is `string | null` (null for pure machine actors). FGA checks require a user principal; machine actors don't have one in the graph. Decision: `check()` returns `false` for null userId (machine actor denied), `listAccessible()` returns `[]`. This is fail-closed behaviour consistent with the spec — machine actors using FGA-guarded routes should use scoped API keys (Plan 49 Seam 2 — out of scope for WS1).

**`FgaError` not re-exported from client.ts.** The `client.ts` doesn't import `FgaError` directly — it is only needed in `store.ts` for the find-or-create logic. The `mapFgaError` function in `client.ts` catches all errors (not just `FgaError`) and maps them to `UnavailableError`. This is intentionally conservative: any SDK error on a check path is a 503, not a silent allow.

**`openfga-db-init` uses `\gexec` workaround.** PostgreSQL has no `CREATE DATABASE IF NOT EXISTS`. The service uses `SELECT 'CREATE DATABASE openfga' WHERE NOT EXISTS (...)\gexec` — a `psql`-specific construct that evaluates the output of the SELECT as a SQL command. This runs via `postgres:16-alpine` (same image as the main postgres service) to avoid shipping `psql` into the openfga image.

**Branch naming.** The worktree was initialized from an old v1 commit, so the branch `plan51/ws1-authz-infra` (locked in the worktree) had the wrong base. A new branch `plan51/ws1-authz-infra-v2` was created off `plan51/integration` in the main checkout. The worktree's working tree was reset via `git checkout plan51/integration -- .` to get the v2 codebase. All commits are on `plan51/ws1-authz-infra-v2`.

**`packages/authz/model/` not created.** Per spec (WS2 surface), no model directory created.

**No `packages/db` schema changes.** Per spec, WS1 touches no schema.

---

## Test evidence

```
bun test packages/authz/src/client.test.ts

 14 pass
 0 fail
 17 expect() calls
Ran 14 tests across 1 file. [57.00ms]
```

Tests cover:
- `check()` returns true/false/undefined (→ false) correctly
- `check()` throws `UnavailableError('AUTHZ_UNAVAILABLE')` on `FgaError` — FAIL CLOSED
- `check()` never silently returns false on transport errors
- `requireRelation()` resolves on true, throws `ForbiddenError('FORBIDDEN_RELATION')` on false
- `requireRelation()` propagates `UnavailableError` when FGA is down
- `listAccessible()` strips `type:` prefix, returns `[]` on empty, throws `UnavailableError` on error
- `writeTuples()` resolves, throws `UnavailableError` on error, handles empty writes/deletes

```
pnpm typecheck

 Tasks:    21 successful, 21 total
 Time:    11.468s
```

```
pnpm --filter @avkash/authz lint
pnpm --filter @avkash/api lint
pnpm --filter @avkash/config lint
# all exit 0, no errors
```

The only pre-existing lint failure is in `@avkash/attendance` (`prefer-const` on `remoteContext`) which is unrelated to WS1 changes.

---

## Open issues (cannot verify without docker)

1. **`openfga-db-init` service_completed_successfully.** Docker Compose requires `service_completed_successfully` for one-shot containers. The `restart: 'no'` + `depends_on: condition: service_completed_successfully` chain is correct per the Compose spec, but can only be verified by running `docker compose up`. The `\gexec` psql construct is standard but also untested locally.

2. **OpenFGA `/healthz` endpoint.** The healthcheck uses `wget -qO- http://localhost:8080/healthz` — verified from the OpenFGA documentation as the correct liveness endpoint for v1.8. Not verified against a live container.

3. **`ensureStore()` at API boot.** `store.ts` provides `ensureStore(name)` but `apps/api/src/index.ts` has not been updated to call it at boot (WS1 scope did not include modifying the server entrypoint). The caller (apps/api boot sequence) should call `ensureStore('avkash')` before handling requests if `FGA_STORE_ID` is not set. This is a TODO for the integration/WS5 wiring step.

4. **FGA check latency on `/health/ready`.** The `authzHealthy(2000)` probe runs in parallel with the DB `ping()` via `Promise.all`. If FGA is slow (cold start after `openfga-migrate`), readiness checks may fail temporarily. The 2s timeout is consistent with typical compose network latency; may need tuning in production.
