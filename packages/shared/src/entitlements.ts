// Per-tenant entitlements (Plan 49 Seam 3 — contracts only).
// The gate that makes "modules sold on top" real: routes 402 when disabled,
// subscribers go inert, jobs skip the org. Distinct from authz (Plan 51): FGA
// answers "who can do what to which resource"; entitlements answer "what did this
// org pay for". They are never merged.

export type EntitlementSource = 'manual' | 'billing' | 'trial';

/** One org × module grant — mirrors the org_entitlement table (Phase 4). */
export interface OrgEntitlement {
  orgId: string;
  moduleKey: string;
  enabled: boolean;
  /** Informational plan tag ('starter' | 'growth' | 'enterprise'). */
  plan?: string | null;
  /** Per-module caps, e.g. { seats: 100 } — also the home of per-org SLA knobs
   *  like the Plan 51 reconciler cadence. */
  limits?: Record<string, number> | null;
  source: EntitlementSource;
  /** null = perpetual; set for trials. */
  validUntil?: Date | null;
}

/** The read surface the registry + guards consume. Hot-path: implementations
 *  cache the per-org set with a short TTL, invalidated on write. */
export interface EntitlementsReader {
  isModuleEnabled(orgId: string, moduleKey: string): Promise<boolean>;
  /** The full enabled set for an org — one load, many checks. */
  entitledModules(orgId: string): Promise<ReadonlySet<string>>;
}
