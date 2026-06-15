// Slack transport — DEFERRED. The package slot
// is kept so the dependency graph reserves the boundary; when Slack returns, the
// adapter re-adds an `authFromSlackUser` resolver in @avkash/auth and maps slash
// commands to domain calls here. No domain authz changes when it comes back.
export const slackDeferred = true as const;
