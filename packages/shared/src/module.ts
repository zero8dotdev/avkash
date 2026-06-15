import type { AuthContext } from './context';
import type { EventSubscriber } from './events';
import type { ResourceFieldGroups } from './field-groups';

// The module manifest.
// A module declares everything the platform mounts for it; the registry
// iterates manifests so adding a module = its package + ONE array entry in
// modules.ts — never edits to app.ts, i18n catalogs, the DTO file, or the scheduler.
// Core never imports a module; modules depend only downward on core.

/** A repeatable job the registry hands to the scheduler. Entitlement-gated:
 *  per-tenant loops skip orgs lacking the module's entitlement. */
export interface JobDefinition {
  /** Unique within the module: '<moduleKey>.<purpose>'. */
  key: string;
  /** Cron expression (BullMQ repeatable syntax). */
  schedule: string;
  handler: () => Promise<void>;
}

/** Read-side composition: a module augments a core view (e.g. Employee Detail)
 *  without core importing it. The aggregator invokes only ENTITLED modules'
 *  contributors, so a section is naturally absent when its module is off. */
export interface ProfileContributor {
  key: string; // 'lms'
  label: string; // 'Courses'
  load(ctx: AuthContext, employeeId: string): Promise<unknown>;
}

/** The manifest. `TRouter` keeps shared dependency-free — apps/api instantiates it
 *  with Hono (`AvkashModule<Hono>`); shared never imports a transport. */
export interface AvkashModule<TRouter = unknown> {
  /** Stable, unique — also the default entitlement key. e.g. 'leave'. */
  key: string;
  title: string;
  /** Entitlement key required to enable; null = core, always on. */
  entitlement: string | null;
  /** Module keys this one requires; validated at boot (e.g. leave → attendance). */
  dependsOn?: string[];

  /** Registry mounts under /v1/<base>, wrapped in requireEntitlement. */
  routes?: (router: TRouter) => void;
  jobs?: JobDefinition[];
  subscribers?: EventSubscriber[];
  profileContributors?: ProfileContributor[];
  /** Locale tag → message catalog, namespaced by module key; merged at boot. */
  i18n?: Record<string, Record<string, string>>;

  // ── Authorization (OpenFGA) ───────────────────────────────────────────────────
  /** FGA model DSL fragment (the module's own types). Core fragments + entitled
   *  modules' fragments are concatenated and written to FGA at boot iff changed. */
  authzModel?: string;
  /** Field-group declarations for the module's resources (defaults; per-org
   *  field_policy rows override). */
  fieldGroups?: ResourceFieldGroups[];
}
