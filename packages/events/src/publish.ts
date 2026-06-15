import { schema } from '@avkash/db';
import type { DB } from '@avkash/db';
import type { AuthContext, EventDef } from '@avkash/shared';

// ── publish ───────────────────────────────────────────────────────────────────
// Insert an outbox row inside the caller's Drizzle transaction. The event is
// guaranteed to exist if and only if the surrounding mutation committed — no
// dual-write problem.
//
// IMPORTANT: pass the tx handle from db.transaction(...) or the route's tx,
// NOT the bare `db` client. Calling with `db` directly works but loses the
// atomicity guarantee (the outbox row commits separately from the mutation).
//
// The payload is validated against the EventDef's Zod schema before insertion.
// A validation failure throws a standard ZodError so the caller's transaction
// rolls back naturally.

// A Drizzle transaction handle OR the bare db client (both expose .insert()).
// Using DB here lets callers pass either db.transaction's tx arg or the bare db
// client directly (the latter loses atomicity — see IMPORTANT note above).
type TxClient = DB | Parameters<Parameters<DB['transaction']>[0]>[0];

export async function publish<P>(tx: TxClient, ctx: AuthContext, def: EventDef<P>, payload: P): Promise<void> {
  // Validate payload — throws ZodError (which rolls the tx back) on mismatch.
  const validated = def.schema.parse(payload);

  await tx.insert(schema.eventOutbox).values({
    orgId: ctx.orgId,
    name: def.name,
    payload: validated as Record<string, unknown>,
    actorId: ctx.userId,
    actorType: ctx.actorType,
    requestId: null, // callers that have a requestId can pass it; extend if needed
    occurredAt: new Date(),
  });
}

// publish with an explicit requestId — useful for HTTP handlers that have the
// correlation id available in context.
export async function publishWithRequestId<P>(
  tx: TxClient,
  ctx: AuthContext,
  def: EventDef<P>,
  payload: P,
  requestId: string | null
): Promise<void> {
  const validated = def.schema.parse(payload);

  await tx.insert(schema.eventOutbox).values({
    orgId: ctx.orgId,
    name: def.name,
    payload: validated as Record<string, unknown>,
    actorId: ctx.userId,
    actorType: ctx.actorType,
    requestId,
    occurredAt: new Date(),
  });
}
