import { Hono } from 'hono';
import { restrictExpiredOrgs } from '@avkash/org';
import { runAccrualCycle, runRollover, runEscalations } from '@avkash/leave';
import { materializeHolidays } from '@avkash/holidays';
import { authzClient } from '@avkash/authz';
import { syncOrgTuples } from '@avkash/authz-sync';
import { outboxDepth, oldestUnpublishedAgeMs } from '@avkash/events';
import type { AuthContext } from '@avkash/shared';
import { requireInternalToken } from '../middleware/internal-auth';

// Synthetic AuthContext for internal/provider-side endpoints that call domain
// functions but do not have a real session. The caller is the platform operator
// (authenticated by the internal token), not a tenant user.
const INTERNAL_CTX: AuthContext = {
  orgId: '',
  userId: null,
  role: 'ADMIN',
  actorType: 'system',
  assurance: 'high',
  via: 'system',
};

// ── Expand-tree path flattener ─────────────────────────────────────────────────
// The OpenFGA Expand API returns a nested tree. This helper produces a flat list
// of human-readable strings like "user:alice ← manager ← team:t1 ← member ← …"
// so the compliance engineer can scan the answer quickly.
//
// The tree shape (from the FGA SDK) is a recursive UsersetTree; we walk it and
// emit one path string per leaf user node found.
function flattenTree(tree: unknown, path: string[] = []): string[] {
  if (!tree || typeof tree !== 'object') return [];
  const node = tree as Record<string, unknown>;

  // Leaf: a concrete user set (union, intersection, or difference node wraps children;
  // a "leaf" node has a "users" array of plain user strings).
  if ('leaf' in node && node.leaf && typeof node.leaf === 'object') {
    const leaf = node.leaf as Record<string, unknown>;
    if ('users' in leaf && Array.isArray(leaf.users)) {
      const currentPath = path.join(' → ');
      return (leaf.users as unknown[]).map((u) => `${String(u)} ← ${currentPath}`);
    }
    // computed / tupleToUserset leaves are TERMINAL in an Expand tree (Expand is
    // single-level; FGA does not inline the referenced userset). Emit the pointer
    // as a path — recursing on the same node here loops forever (CPU-pegged API).
    if ('computed' in leaf && typeof leaf.computed === 'object') {
      const computed = leaf.computed as Record<string, unknown>;
      const relation = typeof computed.userset === 'string' ? computed.userset : '(computed)';
      return [`(via ${relation})${path.length ? ` ← ${path.join(' → ')}` : ''}`];
    }
    if ('tupleToUserset' in leaf && typeof leaf.tupleToUserset === 'object') {
      const ttu = leaf.tupleToUserset as Record<string, unknown>;
      // Shape: { tupleset: 'employee:<id>#team', computed: [{ userset: 'team:<id>#approver' }] }
      const tupleset = typeof ttu.tupleset === 'string' ? ttu.tupleset : '(ttu)';
      const computed = Array.isArray(ttu.computed)
        ? (ttu.computed as Array<Record<string, unknown>>)
            .map((c) => (typeof c.userset === 'string' ? c.userset : ''))
            .filter(Boolean)
        : [];
      const target = computed.length ? ` → ${computed.join(' | ')}` : '';
      return [`(via ${tupleset}${target})${path.length ? ` ← ${path.join(' → ')}` : ''}`];
    }
  }

  // Union node.
  if ('union' in node && node.union && typeof node.union === 'object') {
    const union = node.union as Record<string, unknown>;
    const nodes = Array.isArray(union.nodes) ? (union.nodes as unknown[]) : [];
    return nodes.flatMap((n) => flattenTree(n, path));
  }

  // Intersection node.
  if ('intersection' in node && node.intersection && typeof node.intersection === 'object') {
    const intersection = node.intersection as Record<string, unknown>;
    const nodes = Array.isArray(intersection.nodes) ? (intersection.nodes as unknown[]) : [];
    return nodes.flatMap((n) => flattenTree(n, path));
  }

  // Difference node (base minus subtract).
  if ('difference' in node && node.difference && typeof node.difference === 'object') {
    const difference = node.difference as Record<string, unknown>;
    return flattenTree(difference.base, path);
  }

  // Root of the tree exposes a single node under 'root'.
  if ('root' in node) {
    return flattenTree(node.root, path);
  }

  return [];
}

// Cron-triggered maintenance. Protected by a cron token (X-Internal-Token via
// requireInternalToken). A scheduler hits these on a schedule; all are idempotent
// so re-runs are safe.
export const internal = new Hono()
  .use(requireInternalToken)
  .post('/grace-sweep', async (c) => c.json({ restricted: await restrictExpiredOrgs() }))
  // Daily accrual tick — each policy decides if today is its credit day. `?date=`
  // (YYYY-MM-DD) overrides "today" for testing/backfill. Idempotent per period.
  // Daily accrual cycle (credit + notify). `?date=` (YYYY-MM-DD) overrides "today"
  // for testing/backfill. Idempotent per period — the worker runs the same cycle.
  .post('/accrual-tick', async (c) => {
    const date = c.req.query('date');
    return c.json(await runAccrualCycle(date ? new Date(`${date}T00:00:00Z`) : undefined));
  })
  .post('/leave-rollover', async (c) => {
    const yr = c.req.query('year');
    return c.json(await runRollover(yr ? Number(yr) : undefined));
  })
  // Roll movable holidays forward into the target year (default: next year).
  .post('/holiday-materialize', async (c) => {
    const yr = c.req.query('year');
    return c.json(await materializeHolidays(yr ? Number(yr) : new Date().getFullYear() + 1));
  })
  // Escalate PENDING leaves past their SLA to HR.
  .post('/escalations', async (c) => c.json(await runEscalations()))
  // ── Authz explain (demo beat 7: "why does Priya see salaries?") ─────────────
  // GET /internal/authz/explain?orgId=&relation=&object=&user=
  // Returns the FGA Expand tree plus a flat human-readable path summary.
  // `user` is the FGA user ref (e.g. "user:<uuid>"); `object` is the FGA object
  // ref (e.g. "employee:<uuid>"); `relation` is e.g. "viewer".
  // orgId is accepted but not passed to FGA (tuples are keyed by row UUIDs which
  // are already globally unique — no store-level tenant scoping needed).
  .get('/authz/explain', async (c) => {
    const relation = c.req.query('relation') ?? '';
    const object = c.req.query('object') ?? '';
    const user = c.req.query('user') ?? '';

    if (!relation || !object) {
      return c.json({ error: { code: 'VALIDATION', message: 'relation and object are required' } }, 400);
    }

    // explainAccess only calls FGA Expand — it does not read ctx fields.
    // INTERNAL_CTX is the provider-side synthetic context (system actor).
    // The `user` query param is included in the response for documentation.
    const tree = await authzClient.explainAccess(INTERNAL_CTX, relation, object);
    const paths = flattenTree(tree);

    return c.json({ tree, paths, relation, object, queriedUser: user || null });
  })
  // ── Authz reconcile (demo beat 8: run the repair, show the log) ─────────────
  // GET /internal/authz/reconcile/:orgId
  // Runs syncOrgTuples for one org and returns the repair summary. A nonzero
  // `written` or `deleted` count is a bug signal (domain mutation without event).
  .get('/authz/reconcile/:orgId', async (c) => {
    const orgId = c.req.param('orgId');
    const result = await syncOrgTuples(orgId);
    const repairs = result.written + result.deleted;
    if (repairs > 0) {
      console.error(`[authz-reconcile] REPAIR for org ${orgId}: +${result.written} writes, -${result.deleted} deletes`);
    }
    return c.json({ ...result, repairs });
  })
  // ── Outbox lag metrics (demo beat 3: show the divergence window live) ────────
  // GET /internal/authz/outbox
  // Returns outboxDepth (pending rows) + oldestUnpublishedAgeMs (lag).
  // Alert when outboxDepth > 0 for > N seconds or oldestUnpublishedAgeMs > threshold.
  .get('/authz/outbox', async (c) => {
    const [depth, ageMs] = await Promise.all([outboxDepth(), oldestUnpublishedAgeMs()]);
    return c.json({ outboxDepth: depth, oldestUnpublishedAgeMs: ageMs });
  });
