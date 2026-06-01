# @avkash/web — placeholder

The existing Next.js app currently lives at the repo root. It migrates **into this
package** during the Supabase→Bun cutover (see `plans/09-migration-supabase.md`).

The dependency list is deliberately minimal: `@avkash/shared` only. The frontend
talks to `@avkash/api` over HTTP and consumes its `AppType` for type-safe calls —
it must NOT depend on `@avkash/db` or any domain package. That boundary is the
whole point of the "internal API" design (see `docs/lessons/monorepo.md`).
