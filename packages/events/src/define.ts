import type { z } from 'zod';
import type { EventDef } from '@avkash/shared';

// ── defineEvent ───────────────────────────────────────────────────────────────
// Pair an event name with its Zod payload schema. The resulting EventDef is the
// unit passed to both publish() (produces) and subscribe() (consumes). Keeping
// the schema here rather than inline at the call-site lets TypeScript propagate
// P through the whole pipeline without type assertions.

export function defineEvent<P>(name: string, schema: z.ZodType<P>): EventDef<P> {
  return { name, schema };
}
