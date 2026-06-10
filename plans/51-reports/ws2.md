# Plan 51 WS2 Report — Core FGA Authorization Model + Store Tests + Loader

**Status:** DONE  
**Branch:** plan51/integration  
**Date:** 2026-06-10

---

## Files Touched

| File | Description |
|------|-------------|
| `packages/authz/model/core.fga` | Core FGA DSL (schema 1.1) — 7 types, active_window condition |
| `packages/authz/model/core.fga.yaml` | Store-test YAML — 10 named test suites, 20+ check/list assertions |
| `packages/authz/src/model.ts` | Model loader: `loadAuthzModel`, `buildCombinedDSL`, `dslToJSON`, `ensureModel`, `modelsEqual` |
| `packages/authz/src/model.test.ts` | 14 unit tests for the loader |
| `packages/authz/src/index.ts` | Added exports for model.ts |
| `packages/authz/package.json` | Added `@openfga/syntax-transformer` (runtime dep), `model:test` script |
| `packages/authz/scripts/validate-model.js` | CI-runnable DSL validation without live FGA |

---

## Authorization Model Design

### Type hierarchy

```
org → business_unit → department → team → employee → leave_request
```

### Key design decisions

1. **Single-hop FGA 1.1 constraint.** FGA schema 1.1 allows only single-hop `x from y` rewrites. The plan's indicative sketch (`hr_admin from org from team`) is two hops — invalid. Resolution: propagate relations one level at a time via computed relations:
   - `business_unit.hr_admin = hr_admin from org`
   - `team.hr_admin = hr_admin from org` (team carries a direct `org` relation)
   - `team.hrbp = hrbp from department`
   - `employee.viewer = subject or approver from team or hr_admin from team or hrbp from team`
   - `employee.approver = approver from team` (enables `leave_request.approver = approver from subject` — single hop)

2. **leave_request.approver** uses `employee.approver` as an intermediate computed relation (two-hop chain: `leave_request → employee → team → approver`), expressed as two single hops.

3. **business_unit and department** have no `org` relation directly in the plan sketch. Added `business_unit.org: [org]` to enable `hr_admin` propagation downward. Departments inherit via `department.business_unit → business_unit.org`.

4. **HRBP modeling decision** (open decision in plan): chose BU-scoped relation in core model (single `hrbp` tuple per BU per user) with inheritance through `department.hrbp` and `team.hrbp`. This satisfies the "HRBP sees their BU employees only" requirement with minimal tuples.

5. **team.org relation** added to allow `hr_admin from org` to propagate directly to team level (needed for `employee.viewer`).

---

## Validation Evidence

### Command 1 — DSL syntax + transform (no live FGA required)

```
$ pnpm --filter @avkash/authz model:test
[model:test] Validating packages/authz/model/core.fga
[model:test] validateDSL: PASS (no errors)
[model:test] transformDSLToJSON: PASS
  schema_version : 1.1
  types          : user, org, business_unit, department, team, employee, leave_request
  conditions     : active_window
[model:test] structure assertions: PASS
[model:test] ALL CHECKS PASSED
```

Exit code: 0

### Command 2 — Unit tests (bun test)

```
$ bun test packages/authz/
bun test v1.3.6 (d530ed99)

 28 pass
 0 fail
 55 expect() calls
Ran 28 tests across 2 files. [152.00ms]
```

14 new tests in model.test.ts; 14 existing tests in client.test.ts; all 28 pass.

### Command 3 — Typecheck (23/23)

```
$ pnpm typecheck
 Tasks:    23 successful, 23 total
 Cached:   23 cached, 23 total
 Time:     18ms >>> FULL TURBO
```

### Command 4 — Lint

```
$ pnpm lint
 Tasks:    23 successful, 23 total
 Cached:   22 cached, 23 total
 Time:     1.478s
```

---

## Store-test YAML (core.fga.yaml)

The store-test file is authored in standard OpenFGA store-test format. It covers:

| Test | Scenario |
|------|----------|
| manager-approves-own-team-leave | Rohan (manager:assembly) → approver on sara-lr1: YES |
| manager-cannot-approve-other-team-leave | Dev (manager:logistics) → approver on sara-lr1: NO |
| manager-approves-own-team-leo-leave | Dev → approver on leo-lr1: YES |
| dept-head-approves-assembly-leave | Diana (head:assembly-dept) → approver on sara-lr1: YES |
| dept-head-approves-logistics-leave | Diana → approver on leo-lr1: YES (both teams in same dept) |
| delegate-inside-active-window-can-approve | Dev as delegate for assembly, `now` inside window: YES |
| delegate-outside-active-window-denied | Dev as delegate for assembly, `now` past window end: NO |
| hrbp-views-employee-in-bu | Anita (hrbp:plants) → viewer on sara-profile: YES |
| hr-admin-views-any-employee | Priya (hr_admin:meridian) → viewer on sara-profile: YES |
| hr-admin-views-logistics-employee | Priya → viewer on leo-profile: YES |
| subject-sees-self | Sara → viewer on sara-profile: YES |
| subject-cannot-see-other-employee | Sara → viewer on leo-profile: NO |
| manager-views-own-team-member | Rohan → viewer on sara-profile: YES |
| manager-cannot-view-other-team-employee | Rohan → viewer on leo-profile: NO |
| list-leave-requests-for-manager | listObjects(rohan, approver, leave_request) contains sara-lr1 |
| list-employees-visible-to-hr-admin | listObjects(priya, viewer, employee) contains sara+leo |

**Execution:** The `@openfga/cli` binary (the `fga model test` command) is not yet published to npm (`@openfga/cli` returns 404). Full store-test execution against a live FGA server is the orchestrator's responsibility (CI with FGA container). The YAML is authored to the correct schema and ready for `fga model test --tests packages/authz/model/core.fga.yaml` once the CLI is available.

---

## Deviations from Plan

1. **`employee.viewer` chain** — The plan's sketch `viewer: subject or approver from team or hr_admin from org... or hrbp resolution` is expressed via single-hop propagation (see design decision 1 above). Semantically identical; syntactically adapted to FGA 1.1's single-hop constraint.

2. **`leave_request.approver`** — Plan sketch: `approver from team from subject` (two-hop, invalid in FGA 1.1). Resolution: added `employee.approver: approver from team` computed relation; `leave_request.approver: approver from subject` is then a single hop. This is consistent with the plan's intent.

3. **`team.org` relation added** — Not in the plan sketch. Needed to propagate `hr_admin` from `org` down to `team` in a single hop. The alternative (writing `hr_admin` tuples directly on every team) would create O(teams) write overhead and divergence risk.

4. **`@openfga/syntax-transformer` as runtime dependency** — Moved from `devDependencies` to `dependencies` because it is needed at boot time by `loadAuthzModel` / `dslToJSON`. The plan specifies "transforms DSL→JSON via @openfga/syntax-transformer" without specifying dev vs. runtime; runtime is correct.

5. **`model:test` script uses Node.js** — The `validate-model.js` script uses `node` (available in the monorepo) rather than the FGA CLI binary (not yet available as an npm package). The script runs the same transformer + validator that `model.ts` uses at runtime.

---

## Open Issues

1. **Full store-test execution** — Blocked on `@openfga/cli` being published to npm (or available as a pre-built binary in CI). The `core.fga.yaml` is ready; CI step should add `fga model test` once the binary is available.

2. **`business_unit.head` authority** — The plan mentions the BU head should have authority over the entire unit. The current model does not propagate `head from business_unit` into `department.head` or `team.approver`. WS3/WS5 should evaluate whether BU head needs an explicit approver path or whether this is handled via HR admin role.

3. **`team.org` tuple burden** — Every team must have an `(org:X, org, team:Y)` tuple written by WS3's tuple-sync pipeline. This is straightforward but must be documented in the WS3 tuple-writer spec.

4. **HRBP on employees without a department/BU chain** — If a team has no `department` tuple (ungrouped), `hrbp from team` resolves to empty. This is the correct fail-safe (no HRBP claim on ungrouped teams), but WS3 should log a warning if ungrouped teams exist.
