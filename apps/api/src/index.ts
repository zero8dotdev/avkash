// API entry point — Bun + Hono.
//
// Boot sequence (Plan 51 WS7):
//   1. bootAuthz() — ensureStore('avkash') + ensureModel(core.fga).
//      Resolves WS1 open issue #3: ensureStore was not called at boot.
//      On FGA unavailable: logs and continues (guarded routes return 503 until FGA recovers).
//      On success: logs storeId + modelId so ops can verify the active model.
//   2. Start the Hono server.
//
// TODO (Plan 49 Phase 3 — module registry): pass module authzModel fragments to
//   bootAuthz(fragments) once the AvkashModule manifest registry is implemented.
//   Until then, the core model only is loaded.

import { bootAuthz } from '@avkash/authz';
import { app } from './app';

const port = Number(process.env.PORT ?? 3001);

// ── Boot-time authz initialization ───────────────────────────────────────────
// Fire-and-forget in dev (the server starts regardless), but log clearly.
// In production, a liveness → readiness probe gap covers the warm-up window.
bootAuthz([])
  .then(({ storeId, modelId }) => {
    console.log(`[authz] store=${storeId} model=${modelId}`);
  })
  .catch((err: unknown) => {
    // FGA unreachable at boot — server starts but guarded routes return 503.
    console.error('[authz] boot failed (FGA unreachable? Guarded routes will 503):', err instanceof Error ? err.message : err);
    console.error('[authz] Start OpenFGA and restart the API to initialize the store + model.');
  });

console.log(`avkash api on :${port}`);
export default { port, fetch: app.fetch };
