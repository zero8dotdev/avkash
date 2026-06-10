// @avkash/authz — Identity layer: OpenFGA client (Plan 51 Seam 4).
//
// Sits beside @avkash/auth in the dependency graph.
// Depends only on @avkash/shared + @avkash/config — never on @avkash/db.
//
// Consumer pattern (route handlers):
//   import { authzClient } from '@avkash/authz';
//   await authzClient.requireRelation(ctx, 'approver', objectRef('team', teamId));
//
// Boot pattern (apps/api bootstrap):
//   import { ensureStore, authzHealthy } from '@avkash/authz';
//   const storeId = await ensureStore('avkash');

export { authzClient } from './client';
export { ensureStore } from './store';
export { authzHealthy } from './health';
export { loadAuthzModel, buildCombinedDSL, dslToJSON, ensureModel, modelsEqual } from './model';
export { bootAuthz } from './boot';
