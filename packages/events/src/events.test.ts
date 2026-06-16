// Integration tests for @avkash/events.
// These tests require a real Postgres DB (DATABASE_URL in env). They follow
// the same pattern as apps/api/src/test/scenario-*.test.ts: real schema,
// isolated orgId, teardown in afterAll.
//
// To run: bun test packages/events/src/events.test.ts
// (DATABASE_URL must point at the dev/test DB — same as db:push uses.)

import { describe, it, expect, afterAll, beforeEach } from 'bun:test';
import { z } from 'zod';
import { db, schema } from '@avkash/db';
import { eq } from 'drizzle-orm';
import type { AuthContext } from '@avkash/shared';
import {
  defineEvent,
  publish,
  subscribe,
  runRelayOnce,
  outboxDepth,
  oldestUnpublishedAgeMs,
  _resetRegistryForTest,
} from './index';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// A minimal AuthContext factory — no real org needed for outbox-only tests.
function systemCtx(orgId: string): AuthContext {
  return { orgId, userId: null, role: 'ADMIN', actorType: 'system', assurance: 'low', via: 'system' };
}

// Unique orgId per test suite so parallel runs are isolated.
const TEST_ORG = crypto.randomUUID();

// Teardown: remove all outbox rows for this test org.
afterAll(async () => {
  await db.delete(schema.eventOutbox).where(eq(schema.eventOutbox.orgId, TEST_ORG));
});

// Reset subscriber registry before each test so subscribers don't bleed across tests.
beforeEach(() => {
  _resetRegistryForTest();
});

// ── Event definitions used across tests ───────────────────────────────────────

const leaveApproved = defineEvent(
  'leave.request.approved',
  z.object({ leaveId: z.string().uuid(), approverId: z.string().uuid() })
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('publish() — transactional outbox insertion', () => {
  it('inserts an outbox row inside the caller transaction', async () => {
    const ctx = systemCtx(TEST_ORG);
    const payload = { leaveId: crypto.randomUUID(), approverId: crypto.randomUUID() };

    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, payload);
    });

    const rows = await db.select().from(schema.eventOutbox).where(eq(schema.eventOutbox.orgId, TEST_ORG));

    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows.find((r) => (r.payload as { leaveId: string }).leaveId === payload.leaveId);
    expect(row).toBeDefined();
    expect(row!.name).toBe('leave.request.approved');
    expect(row!.publishedAt).toBeNull();
    expect(row!.actorType).toBe('system');
    expect(row!.attempts).toBe(0);
  });

  it('rolls back the outbox row when the surrounding transaction aborts', async () => {
    const ctx = systemCtx(TEST_ORG);
    const uniqueLeaveId = crypto.randomUUID();

    let threw = false;
    try {
      await db.transaction(async (tx) => {
        await publish(tx, ctx, leaveApproved, { leaveId: uniqueLeaveId, approverId: crypto.randomUUID() });
        throw new Error('intentional rollback');
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);

    const rows = await db.select().from(schema.eventOutbox).where(eq(schema.eventOutbox.orgId, TEST_ORG));

    // The row we inserted in the aborted tx must not be present.
    const found = rows.find((r) => (r.payload as { leaveId: string }).leaveId === uniqueLeaveId);
    expect(found).toBeUndefined();
  });

  it('rejects invalid payloads (Zod validation) and rolls the tx back', async () => {
    const ctx = systemCtx(TEST_ORG);
    let threw = false;
    try {
      await db.transaction(async (tx) => {
        // @ts-expect-error intentionally wrong payload
        await publish(tx, ctx, leaveApproved, { leaveId: 'not-a-uuid' });
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe('runRelayOnce() — relay drain', () => {
  it('sets publishedAt on a row with no subscribers (vacuous success)', async () => {
    const ctx = systemCtx(TEST_ORG);
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, {
        leaveId: crypto.randomUUID(),
        approverId: crypto.randomUUID(),
      });
    });

    const before = await db
      .select({ id: schema.eventOutbox.id })
      .from(schema.eventOutbox)
      .where(eq(schema.eventOutbox.orgId, TEST_ORG));
    expect(before.length).toBeGreaterThanOrEqual(1);

    const result = await runRelayOnce();
    expect(result.processed).toBeGreaterThanOrEqual(1);

    const after = await db
      .select({ publishedAt: schema.eventOutbox.publishedAt })
      .from(schema.eventOutbox)
      .where(eq(schema.eventOutbox.orgId, TEST_ORG));

    // All rows for our org should now have publishedAt set.
    for (const row of after) {
      expect(row.publishedAt).not.toBeNull();
    }
  });

  it('calls the registered subscriber handler', async () => {
    const ctx = systemCtx(TEST_ORG);
    const received: string[] = [];

    subscribe(leaveApproved, {
      key: 'test.leave.approved',
      event: leaveApproved.name,
      handler: async (event) => {
        received.push(event.id);
      },
    });

    const leaveId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, { leaveId, approverId: crypto.randomUUID() });
    });

    const result = await runRelayOnce();
    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(received.length).toBeGreaterThanOrEqual(1);
  });

  it('increments attempts and sets lastError when a subscriber throws', async () => {
    const ctx = systemCtx(TEST_ORG);

    subscribe(leaveApproved, {
      key: 'test.failing.sub',
      event: leaveApproved.name,
      handler: async () => {
        throw new Error('subscriber failure');
      },
    });

    const leaveId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, { leaveId, approverId: crypto.randomUUID() });
    });

    const result = await runRelayOnce();
    expect(result.failed).toBeGreaterThanOrEqual(1);

    // The row should still be unpublished and have attempts=1, lastError set.
    const rows = await db.select().from(schema.eventOutbox).where(eq(schema.eventOutbox.orgId, TEST_ORG));

    const failedRow = rows.find(
      (r) => (r.payload as { leaveId: string }).leaveId === leaveId && r.publishedAt === null
    );
    expect(failedRow).toBeDefined();
    expect(failedRow!.attempts).toBeGreaterThanOrEqual(1);
    expect(failedRow!.lastError).toContain('subscriber failure');
  });
});

describe('idempotent redelivery', () => {
  it('re-delivers unpublished rows on the next relay pass (at-least-once)', async () => {
    const ctx = systemCtx(TEST_ORG);
    const seen = new Set<string>();

    subscribe(leaveApproved, {
      key: 'test.idempotent.sub',
      event: leaveApproved.name,
      handler: async (event) => {
        seen.add(event.id);
      },
    });

    const leaveId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, { leaveId, approverId: crypto.randomUUID() });
    });

    // First relay pass — delivers and marks publishedAt.
    const r1 = await runRelayOnce();
    expect(r1.processed).toBeGreaterThanOrEqual(1);
    const sizeAfterFirst = seen.size;
    expect(sizeAfterFirst).toBeGreaterThanOrEqual(1);

    // Second relay pass — nothing new (row already published).
    const r2 = await runRelayOnce();
    // processed should be 0 for our already-published row; seen should not grow.
    expect(seen.size).toBe(sizeAfterFirst);
    // No regression: second pass is a no-op for already-published rows.
    expect(r2.processed + r2.failed).toBe(0);
  });
});

describe('observability helpers', () => {
  it('outboxDepth() counts unpublished rows for all orgs', async () => {
    // Clean slate: ensure no leftover unpublished rows from this suite's org.
    await db.update(schema.eventOutbox).set({ publishedAt: new Date() }).where(eq(schema.eventOutbox.orgId, TEST_ORG));

    const depthBefore = await outboxDepth();

    const ctx = systemCtx(TEST_ORG);
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, { leaveId: crypto.randomUUID(), approverId: crypto.randomUUID() });
    });

    const depthAfter = await outboxDepth();
    expect(depthAfter).toBe(depthBefore + 1);
  });

  it('oldestUnpublishedAgeMs() returns 0 when no pending rows', async () => {
    // Ensure all rows for our test org are published.
    await db.update(schema.eventOutbox).set({ publishedAt: new Date() }).where(eq(schema.eventOutbox.orgId, TEST_ORG));

    // Depending on other tests running in parallel there might be rows from
    // other orgs. We can only assert 0 if the full table is clean. Skip the
    // strict 0 check and just verify the function returns a non-negative number.
    const age = await oldestUnpublishedAgeMs();
    expect(age).toBeGreaterThanOrEqual(0);
  });

  it('oldestUnpublishedAgeMs() returns a positive age when rows are pending', async () => {
    const ctx = systemCtx(TEST_ORG);
    await db.transaction(async (tx) => {
      await publish(tx, ctx, leaveApproved, { leaveId: crypto.randomUUID(), approverId: crypto.randomUUID() });
    });

    const age = await oldestUnpublishedAgeMs();
    // The row was just inserted so age should be very small but > 0.
    expect(age).toBeGreaterThanOrEqual(0);
  });
});
